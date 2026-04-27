/**
 * Model Switcher Extension
 *
 * Switch models mid-session via command, shortcut, or LLM tool.
 *
 * Usage:
 *   /model-switch              - Open interactive model selector
 *   /model-switch openai/gpt-4o - Switch directly by provider/model
 *   Ctrl+Shift+M              - Open interactive model selector (shortcut)
 *
 * The LLM can also call the switch_model tool directly.
 */

import { Type } from "typebox";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
	/**
	 * Format a number into a human-readable string.
	 */
	function formatNumber(n: number): string {
		if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
		if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
		return String(n);
	}

	/**
	 * Build a display label for a model.
	 */
	function modelLabel(model: any): string {
		const name = model.name && model.name !== model.id ? ` (${model.name})` : "";
		return `${model.provider}/${model.id}${name}`;
	}

	/**
	 * Update the status bar with the current model.
	 */
	function updateStatus(ctx: ExtensionContext) {
		const model = ctx.model;
		if (model) {
			ctx.ui.setStatus("model-switcher", `🤖 ${model.provider}/${model.id}`);
		}
	}

	/**
	 * Resolve a model identifier and switch to it.
	 * Accepts "provider/model-id" or just "model-id".
	 */
	async function switchModel(selector: string, ctx: ExtensionContext): Promise<string> {
		let model = undefined;

		if (selector.includes("/")) {
			const [provider, ...modelParts] = selector.split("/");
			const modelId = modelParts.join("/");
			model = ctx.modelRegistry.find(provider, modelId);
		}

		// If not found or no slash, search across all models
		if (!model) {
			ctx.modelRegistry.refresh();
			const models = await ctx.modelRegistry.getAvailable();
			model = models.find((m: any) => m.id === selector || m.id.includes(selector));
		}

		if (!model) {
			return `Model not found: ${selector}`;
		}

		const success = await pi.setModel(model);
		if (!success) {
			return `No API key available for ${model.provider}/${model.id}`;
		}

		updateStatus(ctx);

		if (ctx.hasUI) {
			ctx.ui.notify(`Switched to ${model.provider}/${model.id}`, "success");
		}

		return `Switched to ${model.provider}/${model.id}`;
	}

	/**
	 * Show the interactive model selector.
	 */
	async function showModelSelector(ctx: ExtensionContext): Promise<void> {
		ctx.modelRegistry.refresh();
		const models = await ctx.modelRegistry.getAvailable();

		if (models.length === 0) {
			ctx.ui.notify("No models available. Use /login or configure models.json to add providers.", "warning");
			return;
		}

		// Build options with provider grouping
		const options = models
			.sort((a: any, b: any) => a.provider.localeCompare(b.provider))
			.map((m: any) => modelLabel(m));

		const currentLabel = ctx.model ? modelLabel(ctx.model) : "";
		const titles = [
			"Switch Model",
			currentLabel ? `Current: ${currentLabel}` : "",
		].filter(Boolean);

		const choice = await ctx.ui.select(titles, options);

		if (choice === null) return;

		// Parse back: "provider/model-id"
		await switchModel(choice, ctx);
	}

	// Register /model-switch command
	pi.registerCommand("model-switch", {
		description: "Switch the current model",
		handler: async (args, ctx) => {
			if (args?.trim()) {
				await switchModel(args.trim(), ctx);
				return;
			}
			await showModelSelector(ctx);
		},
	});

	// Register Ctrl+Shift+M shortcut
	pi.registerShortcut("ctrl+shift+m", {
		description: "Switch model",
		handler: async (ctx) => {
			await showModelSelector(ctx);
		},
	});

	// Register tool callable by the LLM
	pi.registerTool({
		name: "switch_model",
		label: "Switch Model",
		description: "Switch to a different AI model during the session. Use this to change the model being used for responses.",
		promptSnippet: "Switch the AI model mid-session",
		promptGuidelines: [
			"Use switch_model only when the user explicitly asks to change models or switch providers.",
		],
		parameters: Type.Object({
			provider_or_model: Type.String({
				description: 'Provider and model ID to switch to, e.g. "anthropic/claude-sonnet-4-5" or just "gpt-4o"',
			}),
		}),
		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			// Build list of available models for the LLM
			ctx.modelRegistry.refresh();
			const models = await ctx.modelRegistry.getAvailable();
			const available = models.map((m: any) => modelLabel(m)).join("\n");

			// Try to switch
			const result = await switchModel(params.provider_or_model, ctx);

			return {
				content: [
					{
						type: "text",
						text: `${result}\n\nAvailable models:\n${available}`,
					},
				],
				details: {},
			};
		},
	});

	// Listen for model changes to update status bar
	pi.on("model_select", async (_event, ctx) => {
		updateStatus(ctx);
	});

	// Initialize status bar on session start
	pi.on("session_start", async (_event, ctx) => {
		updateStatus(ctx);
	});
}
