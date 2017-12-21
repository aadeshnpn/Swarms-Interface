class ChatRoom {
	constructor(ui) {
		ui.register('updateChat', this.update.bind(this));
		this.chatHistory = '';
		console.log('ChatRoom initialized.');
	}

	update(data) {
		console.log('ChatRoom update called.');
		if (data !== this.chatHistory) {
			this.chatHistory = data;
			console.log(this.chatHistory);
			document.getElementById("chatwindow").innerHTML = this.chatHistory;
		}
	}
}
