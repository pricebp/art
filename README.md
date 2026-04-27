────────────────────────────────────────────────────                                                                                  
                                                                                                                                                                     
 ART — Agent Routing Table                                                                                                                                           
                                                                                                                                                                     
 A routing skill that automatically directs tasks to the best-suited model based on a configurable agent-routing-table.md mapping.                                   
                                                                                                                                                                     
 ### How It Works                                                                                                                                                    
                                                                                                                                                                     
 1. Detect the current active model.                                                                                                                                 
 2. Analyze the user's prompt for context clues.                                                                                                                     
 3. Match against the routing table to find the optimal model.                                                                                                       
 4. Switch models if needed, then respond directly — no forwarding notices.                                                                                          
                                                                                                                                                                     
 ### When to Use                                                                                                                                                     
                                                                                                                                                                     
 - The user invokes /skill:art directly.                                                                                                                             
 - A prompt would benefit from a specialized model (e.g., a coding model for code tasks, a reasoning model for complex analysis).                                    
                                                                                                                                                                     
 ### Setup                                                                                                                                                           
                                                                                                                                                                     
 You must setup the agent-routing-table.md. Ask your LLMs to update it with their strengths. 
 
 ART depends only on:                                                                                                                                                                                                                                                                                                 
 ```
   extensions/
   ├── model-switcher.ts                                                                                                                                                            
   art/                                                                                                                                                              
   ├── SKILL.md                # This skill definition                                                                                                               
   ├── agent-routing-table.md  # Model-to-context mapping                                                                                                            
 ```                                                                                                                                                                 
                                                                                                                                                                     
 The routing table is the authoritative source — ART never overrides its decisions.                                                                                  
                                                                                                                                                                     
────────────────────────────────────────────────────
