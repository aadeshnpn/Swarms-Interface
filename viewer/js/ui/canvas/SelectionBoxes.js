class SelectionBoxes
{
   constructor(){
      cursors.default.addEventListener('mousedown', function(e) { ui.clearSelectedAgents(); });
   }

   update(){
      // no-op
   }

   draw(ctx, debug = false){
      if (ui.agentsSelected() == 0)
         return;

      ctx.save();

      for (let agent of world.agents)
      {
         if (ui.isAgentSelected(agent.id))
         {
            ctx.save();
            ctx.translate(agent.x, agent.y);

           // also draw a neat little selection box around the agent if it's selected

           var outlineXy = (bee.width > bee.height) ? bee.width : bee.height;
           // move 7px up and left from agent's centre
           ctx.translate(-outlineXy/2 - 3, -outlineXy/2 - 3);
           ctx.strokeStyle = "rgb(24, 215, 255)";

           // draw a rectangle from origin (agent centre - (7px, 7px), to agent
           // centre + (7px, 7px) )
           ctx.strokeRect(0, 0, outlineXy + 3, outlineXy + 3);
           ctx.restore();
         }
      }

      ctx.restore();
   }
}
