class Message{
  constructor(){
    this.x        =undefined;
    this.y        =undefined;
    this.message  =undefined;
    this.width    =undefined;
    this.height   =undefined;
    this.fontSize =undefined;
    this.fontColor=undefined;
  }
  create(message){
    console.log(message);
    this.message = message;
    this.fontSize=48;
    this.width = this.message.length*(this.fontSize);
    this.height=this.fontSize; //With multiple lines of message, this will be multiplied by the number of lines
    this.x = window.innerWidth/2 - this.width/2;
    this.y = window.innerHeight/2 - this.height/2;
    this.fontColor = "rgb(255, 0, 0)"

  }
  draw(){
    $("#messageBox").css("width", (world.width-200).toString() + "px")
    $("#messageBox").css("height", (world.height).toString() + "px")
    $("#messageBox").css("position", "absolute")
    $("#messageBox").css("top", "0")
    $("#messageBox").css("bottom", "40px")
    $("#messageBox").css("left", "0")
    $("#messageBox").css("right", "0")
    $("#messageBox").css("margin", "auto")
    $("#messageBox").css("text-align", "center")
    $("#messageBox").css("padding-left", "100px")
    $("#messageBox").css("padding-right", "100px")
    // $("#messageBox").css("line-height", (world.height*2/5).toString()+"px")
    $("#messageBox").html("<br><br><h2 style='font-size:50px;'>Your Task</h2>")
    console.log(this.message);
    $("#messageBox").append("<h3>"+this.message+"</h3>")


    $("#messageBox").css("z-index", "100 !important")
    $("#messageBox").css("background-color", "rgba(125, 169, 193, 0.8)")
  }

}
