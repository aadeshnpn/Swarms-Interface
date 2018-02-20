class ChatRoom {
	constructor(ui) {
		ui.register('updateChat', this.update.bind(this));
		this.chatHistory = '';
	}

	update(data) {
		if (data !== this.chatHistory) {
			this.chatHistory = data;
			document.getElementById("chatwindow").innerHTML = this.chatHistory;
		}
	}
}
