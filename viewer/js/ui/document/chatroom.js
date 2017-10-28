class chatRoom
{
   constructor(ui)
   {
      ui.register('updateChat', this.update.bind(this));
      this.chatHistory = '';
      console.log('chatRoom initialized.');
   }
   update(data)
   {
       console.log('chatRoom update called.');
       if(data!== this.chatHistory){
            this.chatHistory = data;
            console.log(this.chatHistory)
            document.getElementById("chatwindow").innerHTML = this.chatHistory;
       }
   }
}
