class DebugTable
{
   constructor(ui)
   {
      ui.register('update', this.update.bind(this));

      // Hard code to make sure id, x, and y always appear first in the headers
      var infoTableHeaders = $('#infoTableHeaders')
      infoTableHeaders.append(`<th id='id'>ID</th>`);
      infoTableHeaders.append(`<th id='x'>X</th>`);
      infoTableHeaders.append(`<th id='y'>Y</th>`);
   }

   update(data)
   {
      if (ui.agentsSelected() === 0)
      {
         $('#infoTable').hide();
      }
      else {
         $('#infoTable').show();

         // If there are more rows than selected agents, an agent must have died
         // It won't appear in the data, so we have to clean up manually
         if ($('#infoTable .agentInfo').length > ui.agentsSelected())
         {
            // Throw out the whole thing--probably cheaper than checking each row against each agent
            $('#infoTable .agentInfo').remove();
         }

         for (var agent of data.agents)
         {
            if (ui.isAgentSelected(agent.id))
            {
               for (var [prop, val] of Object.entries(agent))
               {
                  // We don't have a header for this property, so create it
                  if (!$(`#infoTableHeaders #${prop}`).length)
                  {
                     let prettyProp = this.beautifyProp(prop);
                     $(`#infoTableHeaders`).append(`<th id='${prop}'>${prettyProp}</th>`);
                  }

                  // This agent doesn't have a row in our debug table, so create one
                  if (!$(`#agentInfo${agent.id}`).length)
                  {
                     
                     let row = $(document.createElement('tr'));
                     row.attr('id', `agentInfo${agent.id}`);
                     row.attr('class', 'agentInfo');

                     // Again, hardcode id, x, and y props--ugly, but since the data
                     // is just an unorganized blob of JSON, there is no other way
                     // to guarantee a particular order
                     row.append(`<td id='id${agent.id}'></td>`);
                     row.append(`<td id='x${agent.id}' class='agentCoord'></td>`);
                     row.append(`<td id='y${agent.id}' class='agentCoord'></td>`);
                     $('#infoTable').append(row);
                  }

                  // A place for this specific property for this specific agent doesn't exist, create one
                  if (!$(`#${prop}${agent.id}`).length)
                  {
                     $(`#agentInfo${agent.id}`).append(`<td id='${prop}${agent.id}'></td>`);
                  }

                  // Potential site is treated specially, since it's an array
                  if (prop === 'potential_site' && val != null)
                  {
                     val = val[0].toFixed(2) + ", " + val[1].toFixed(2);
                  }
                  if (typeof val === 'number')
                  {
                     val = val.toFixed(2);
                  }

                 $(`#${prop}${agent.id}`).html(val);
               }

            }
            else
            {
               // Agent isn't selected, remove its entry
               if ($(`#agentInfo${agent.id}`))
               {
                  $(`#agentInfo${agent.id}`).remove()
               }
            }
         }
      }
   }

   // This function takes in the ugly property name (which comes from python)
   // and turns it into something resembling words
   beautifyProp(prop)
   {
      // Split into words based on underscores and capitalize each word
      var tokens = prop.split("_");
      tokens.forEach(function(element, index, array)
      {
         array[index] = element.charAt(0).toUpperCase() + element.slice(1);
      });

      return tokens.join(" ");
   }

}
