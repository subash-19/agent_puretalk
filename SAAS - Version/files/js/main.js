	let filter_badwords = false;
	let copy_text_in_chat = false;
	let display_audio_button_answers = false;
	let use_text_stream = true;
	let is_gpt_model = false;
	let langLoaded = false;

	let CHAT_PHP_url = '../php/api.php';
	let DALLE_PHP_url = '../php/dall-e-2.php';
	let microphone_speak_lang = "";
	let google_voice = "";
	let google_voice_lang_code = "";

	let badWords = [];
	let langData = [];
	let AI = [];
	let array_voices = [];
	let langDataObject;
	let chat_minlength = 0;
	let chat_maxlength = 0;


	//send chat
	$(".btn-send-chat").on("click", function(){
		sendUserChat();
	})

	$('#chat').on('keydown', function(event) {
	  if (event.shiftKey && event.keyCode === 13) {
	    $(".btn-send-chat").click();
	    event.preventDefault();
	  }
	});


	window.addEventListener('load', initializePage);
	async function initializePage() {
		await fetchLanguageData();
	}

	// Função para buscar os dados do idioma
	async function fetchLanguageData() {
		if(!langLoaded){
			langLoaded = true;
			let langPath = "/php/json.php?action=language";

			try {
				const langResponse = await fetch(langPath);
				const langData = await langResponse.json();
				lang = Object.assign({}, ...langData);
				return langData;
			} catch (error) {
				console.log("Error fetchLanguageData");
			}
		}
	}

	// Função para buscar os dados da IA
	async function fetchLoadData(AI_ID) {

		let AIPath = "/php/json.php?action=prompt&id="+AI_ID+"&v=" + randomNumber;

		try {
			const promptResponse = await fetch(AIPath);

	    // Configurações da IA
			const AIPathData = await promptResponse.json();
			AI = Object.assign({}, ...AIPathData);
			avatar_in_chat = AI.display_avatar ? `<div class="user-image"><img onerror="this.src='../img/no-image.svg'" src="../${AI.image}" alt="${AI.image}" title="${AI.name}"></div>` : '';
			audio_in_chat = AI.use_google_voice ? `<div class='chat-audio'><img data-play="false" src='../img/btn_tts_play.svg'></div>` : '';
			copy_text_in_chat = AI.display_copy_btn ? `<button class="copy-text" onclick="copyText(this)"><svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg> <span class="label-copy-code">${lang.copy_text1}</span></button>` : '';
			chat_minlength = AI.chat_minlength;
			chat_maxlength = AI.chat_maxlength;
			microphone_speak_lang = AI.mic_speak_lang;
			filter_badwords = AI.filter_badwords;
			google_voice_lang_code = AI.google_voice_lang_code;
			google_voice = AI.google_voice;
			is_gpt_model = AI.API_MODEL.includes('gpt-');

			if(filter_badwords){
				fetchBadWordsData();
			}

			return AIPathData;
		} catch (error) {

		  // Verifica se 'lang' está definido. Se não estiver, chama 'fetchLanguageData' novamente
			if (typeof lang === 'undefined') {
				await fetchLanguageData();
				fetchLoadData(AI_ID);
			}else{
				console.log("❌"+error);	  	
			}	
		}
	}

	let randomNumber = Math.floor(Math.random() * 100000000);

	async function fetchBadWordsData() {
		let badWordsPath = "/php/json.php?action=badwords";
		fetchLanguageData();
		try {
			const badWordsResponse = await fetch(badWordsPath);
			const badWordsData = await badWordsResponse.json();
			if(badWordsData.badwords){
				badWords = badWordsData.badwords.toLowerCase().split(",");
				return badWords;
			}
		} catch (error) {
			console.log("❌"+error);
		}
	}

	//Function that sends the user's question to the chat in html and to the API
	function sendUserChat(){
		let chat = $("#chat").val();

		if(filter_badwords){
		    let modifiedChat = chat;
		    badWords.forEach(badWord => {
		        const trimmedBadWord = badWord.trim();
		        const regex = new RegExp(trimmedBadWord, 'gi');
		        if (chat.match(regex)) {
		            modifiedChat = modifiedChat.replace(regex, '*'.repeat(trimmedBadWord.length));
		        }
		    });

		    if (chat !== modifiedChat) {
		        $("#chat").val(modifiedChat);
		        toastr.error(`${lang.badword_feedback}`);
		        return false;
		    }
		}

		//checks if the user has entered the minimum amount of characters
		if(chat.length < chat_minlength){
			toastr.error(`${lang.error_chat_minlength} ${chat_minlength} ${lang.error_chat_minlength_part2}`);
			$('#chat').addClass('pulse-animation').delay(1000).queue(function() {
				$(this).removeClass('pulse-animation').dequeue();
			})
			return false;
		}

		chat = escapeHtml(chat)

		$("#overflow-chat").append(
			"<div class='conversation-thread thread-user'>" +
				"<div class='message-container'>" +
					"<div class='message-info'>" +
						"<div class='wrapper-chat-header'>" +
							"<div class='user-name'>" +
								"<h5>" + lang.you + "</h5>" +
							"</div>" +
							"<div class='chat-actions'>" +
								(AI.use_google_voice ? "<div class='chat-audio'><img data-play='false' src='../img/btn_tts_play.svg'></div>" : "") +
								(AI.display_copy_btn ? "<span onclick='copyText(this)' class='copy-text' title='" + lang.copy_text1 + "'><i class='bi bi-clipboard'></i></span>" : "") +
							"</div>" +
						"</div>" +
						"<div class='message-text'>" +
							"<div class='chat-response'>" + chat + "</div>" +
						"</div>" +
						"<div class='date-chat'>" +
							"<img src='../img/icon-clock.svg'> " + currentDate() +
						"</div>" +
					"</div>" +
				"</div>" +
			"</div>"
		);

		scrollChatBottom();
		hljs.highlightAll();

		if(chat.includes("/img")) {
			if(AI.use_dalle){
				appendChatImg(chat);
			}else{
				let modifiedChat = chat.replace("/img", "");
				getResponse(modifiedChat);
			}
		}else{
			getResponse(chat);
		}

		$("#chat").val("");
		disableChat();
		checkShareButtonDisplay();
	}

	var configAllowedTags = { 
		ALLOWED_TAGS: ['a'], 
		ALLOWED_ATTR: ['href'] 
	};

	const escapeHtml = (str) => {
		str = str.replace(/↵↵.*?\./gs, '');

	  // Substitui URLs por links clicáveis antes de converter caracteres especiais
	  str = str.replace(/(https?:\/\/[^\s]+)|(www\.[^\s]+)\./g, function(match){
	    let url = match.startsWith('www.') ? 'https://' + match.slice(0, -1) : match.slice(0, -1);
	    return '<a href="'+ url +'" target="_blank" rel="noopener noreferrer">'+ match.slice(0, -1) +'</a>';
	  });

	  // Remove a stream &lt;span class="get-stream"&gt;
		str = str.replace(/&lt;span\s+class="get-stream"&gt;/g, "");

	  // Remove a tag de fechamento </span>
		str = str.replace(/&lt;\/span&gt;/g, "");

	  // Substitui o trecho ```code``` por <pre><code>code</code></pre>
		str = str.replace(/```(\w+)?([\s\S]*?)```/g, '<pre><code>$2</code><button class="copy-code" onclick="copyCode(this)"><svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg> <span class="label-copy-code">'+lang.copy_code1+'</span></button></pre>').replace(/(\d+\.\s)/g, "<strong>$1</strong>").replace(/(^[A-Za-z\s]+:)/gm, "<strong>$1</strong>");

	  // Sanitize HTML com DOMPurify
		str = DOMPurify.sanitize(str, configAllowedTags);

		return str;
	};


	function currentDate(){
		const timestamp = new Date();
		return timestamp.toLocaleString();
	}	

	function copyText(button){
	    const div = button.closest('.message-container');
	    const code = div.querySelector('.message-text .chat-response');
	    const range = document.createRange();
	    range.selectNode(code);
	    window.getSelection().removeAllRanges();
	    window.getSelection().addRange(range);
	    document.execCommand("copy");
	    window.getSelection().removeAllRanges();
	    button.innerHTML = '<i class="bi bi-clipboard-check"></i> ' + lang.copy_text2;
	    button.disabled = true;
	}


	function copyCode(button) {
		const pre = button.parentElement;
		const code = pre.querySelector('code');
		const range = document.createRange();
		range.selectNode(code);
		window.getSelection().removeAllRanges();
		window.getSelection().addRange(range);
		document.execCommand("copy");
		window.getSelection().removeAllRanges();
		button.innerHTML = lang.copy_code2;
	}

		//Force chat to scroll down
		function scrollChatBottom() {
		    let objDiv = document.getElementById("overflow-chat");

		    // Detectar se a página está em um iframe
		    let isInIframe = false;
		    try {
		        isInIframe = window.self !== window.top;
		    } catch (e) {
		        isInIframe = true;
		    }

		    // Detectar se o dispositivo é móvel
		    let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

		    // Só executar a rolagem se a página não estiver em um iframe e o dispositivo não for móvel
		    if (!isInIframe && !isMobile) {
		        objDiv.scrollTop = objDiv.scrollHeight;
		    }

		    hljs.highlightAll();
		}



	function stopChat() {
		if (source) {
			enableChat();
			source.close();
			$(".cursor").remove();

			var htmlText = $(".get-stream:last").html();
			var textWithoutHtml = $("<div>").html(htmlText).text();
			var characterCount = textWithoutHtml.length;

			fetch('/modules/customer/customer-stop-chat.php', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ characterCount: characterCount })
			})
			.then(response => response.json())
			.then(data => {
				if (data.error) {
					console.log(data.message);
				} else {
					if(data.message == "success"){
						updateCredits();
					}else{
						console.log(data);
					}
				}
			})
			.catch(error => console.log(error));
		}
	}


	$(".btn-cancel-chat").on("click", function(){
		stopChat();
	})

		//Disable chat input
	function disableChat(){
		$(".character-typing").css('visibility','visible')
		$(".character-typing").css('display','flex');
		$(".character-typing span").html(AI.name);
		$(".btn-send-chat,#chat").attr("disabled",true);
		$(".btn-send-chat").hide();
		$(".btn-cancel-chat").show();				
	}	

		//Enable chat input
	function enableChat(){
		$(".character-typing").css('visibility','hidden')
		$(".btn-send-chat,#chat").attr("disabled",false);
		$(".btn-send-chat").show();
		$(".btn-cancel-chat").hide();				
		var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
		if(!isMobile) {
			setTimeout(function() {
				$('#chat').focus();
			}, 300);
		}

	}

		//Main function of GPT-3 chat API
	async function getResponse(prompt) {

		
			//Tone
		if ($("#selectTone").val() != "") {
			prompt += "↵↵ Please write in " + $("#selectTone").val() + " tone.";
		}

			//Writing Style
		if ($("#selectWritingStyle").val() != "") {
			prompt += "↵↵ " + $("#selectWritingStyle").val() + " writing style.";
		}

			//Language
		if ($("#selectLanguage").val() != "") {
			prompt += "↵↵Answer in language " + $("#selectLanguage").val()+".";
		}



		const params = new URLSearchParams();
		params.append('prompt', prompt);
		params.append('ai_id', AI.id);

		try {
			const randomID = generateUniqueID();
			source = new SSE(CHAT_PHP_url, {headers: {'Content-Type': 'application/x-www-form-urlencoded'},payload: params,method: 'POST'});
			streamChat(source,randomID);
			source.stream();

			$("#overflow-chat").append(
				"<div class='conversation-thread thread-ai'>" +
					avatar_in_chat +
					"<div class='message-container'>" +
						"<div class='message-info'>" +
							"<div class='wrapper-chat-header'>" +
								"<div class='user-name'>" +
									"<h5>" + AI.name + "</h5>" +
								"</div>" +
								"<div class='chat-actions'>" +
									(AI.use_google_voice ? "<div class='chat-audio'><img data-play='false' src='../img/btn_tts_play.svg'></div>" : "") +
									(AI.display_copy_btn ? "<span onclick='copyText(this)' class='copy-text' title='" + lang.copy_text1 + "'><i class='bi bi-clipboard'></i></span>" : "") +
								"</div>" +
							"</div>" +
							"<div class='message-text'>" +
								"<div class='chat-response " + randomID + "'>" +
									"<span class='get-stream'></span>" +
									"<span class='cursor'></span>" +
								"</div>" +
							"</div>" +
							"<div class='date-chat'>" +
								"<img src='../img/icon-clock.svg'> " + currentDate() +
							"</div>" +
						"</div>" +
					"</div>" +
				"</div>"
			);


			$(`.chat_${randomID} .chat-audio`).hide();
			scrollChatBottom();			
		} catch (e) {
			toastr.error(`Error creating SSE: ${e}`);
		}
	}	

	function streamChat(source, randomID) {
		let fullPrompt = "";
		let partPrompt = "";
		source.addEventListener('message', function (e) {

			let data = e.data;
			let tokens = {};

			if (typeof data === 'string') {
				if (data.startsWith('[ERROR]')) {
					let message = data.substr('[ERROR]'.length).trim();
					toastr.error(message);
					enableChat();
					return;
				} else if (data === '[DONE]') {
					$(".cursor").remove();
					str = $(`.${randomID}`).html();
					str = escapeHtml(str);
					$(`.${randomID}`).html(str);
					$(`.chat_${randomID} .chat-audio`).fadeIn('slow');
					enableChat();
					scrollChatBottom();
					updateSessionChat(AI.slug)       

					if(!use_text_stream){
						$(`.${randomID}`).append(fullPrompt);
						scrollChatBottom();
					}
					updateCredits();
					return false;
				}
						//Chat limit
				const json = JSON.parse(e.data);
				if(json.error === "[CHAT_LIMIT]"){
					const modalElement = document.getElementById('modalDemo');
					const modalInstance = new bootstrap.Modal(modalElement);
					$('.conversation-thread.thread-ai:last').remove()
					enableChat();
					modalInstance.show();
					return false;
				}

				if(json.error === "[NO_CREDIT]"){
					toastr.error(lang.credits_run_out)
					enableChat();
					$('.conversation-thread.thread-ai:last').remove();
					return false;
				}					
				else {
					try {
						tokens = JSON.parse(data);
					} catch (err) {
						toastr.error(`Error parsing SSE data as JSON: ${err}`);
						return;
					}
				}
			}

			if (!tokens || !tokens.choices || tokens.choices.length === 0) {
				toastr.error("❌ "+tokens.message)
				enableChat();
				$(`.chat_${randomID}`).remove();
				return;
			}

			var choice = is_gpt_model ? tokens.choices[0].delta : tokens.choices[0];
			partPrompt = "";
			if (choice.content || choice.text) {
				fullPrompt += choice.content || choice.text;
				partPrompt = choice.content || choice.text;
			}

			if(use_text_stream){
				$(`.${randomID} .get-stream`).append(formatSpecialCharactersRealTime(partPrompt));
				scrollChatBottom();
			}

		});
	}

	function updateSessionChat(slug){
		fetch("../modules/customer/chat-session.php", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: 'slug=' + slug + '&isFetchRequest=true'
		})
		.then(response => response.json())
		.then(data => {
			console.log(data);
		})
	}

	function generateUniqueID(prefix = 'id_') {
		const timestamp = Date.now();
		return `${prefix}${timestamp}`;
	}	

	const formatSpecialCharactersRealTime = (str) => {
		const parser = new DOMParser();
		const decoded = parser.parseFromString(`<!doctype html><body>${str}`, 'text/html').body.textContent;
		return decoded;
	};			


	function backToTop(){
		window.scrollTo({ top: 0, behavior: 'smooth' });			
	}


	const textarea = document.querySelector('#chat');
	const microphoneButton = document.querySelector('#microphone-button');

	let isTranscribing = false; // Initially not transcribing

	if (microphoneButton) {
		if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
			const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

			recognition.lang = microphone_speak_lang;
			recognition.continuous = true;

			recognition.addEventListener('start', () => {
				$(".btn-send-chat").attr("disabled", true);
				microphoneButton.setAttribute("src", "../img/mic-stop.svg");
			});

			recognition.addEventListener('result', (event) => {
				const transcript = event.results[0][0].transcript;
				textarea.value += transcript + '\n';
			});

			recognition.addEventListener('end', () => {
				$(".btn-send-chat").attr("disabled", false);
				microphoneButton.setAttribute("src", "../img/mic-start.svg");
	      isTranscribing = false; // Set transcription as ended
	    });

			microphoneButton.addEventListener('click', () => {
				if (!isTranscribing) {
	        // Start transcription if not already transcribing
					recognition.start();
					isTranscribing = true;
				} else {
	        // Stop transcription if already transcribing
					recognition.stop();
					isTranscribing = false;
				}
			});
		} else {
			console.log('Speech Recognition API not supported by the browser');
			microphoneButton.style.display = "none";
		}
	}



	const arrow = $('.arrow-up');
	arrow.toggleClass('arrow-down arrow-up');

	$('.btn-options-input').click(function() {
		if (arrow.hasClass('arrow-down')) {
			arrow.removeClass('arrow-down').addClass('arrow-up');
			$(".col-options-input .form-floating").show();
		} else {
			arrow.removeClass('arrow-up').addClass('arrow-down');
			$(".col-options-input .form-floating").hide();
		}
	});	


		// Define the key for the localStorage storage item
	const localStorageKey = "col-contacts-border-display";

		// Get the current display state of the div from localStorage, if it exists
	let displayState = localStorage.getItem(localStorageKey);
	if (displayState) {
		$(".col-contacts-border").css("display", displayState);
	} else {
		  // If the display state of the div is not stored in localStorage, set the default state to "none"
		$(".col-contacts-border").css("display", "none");
	}

		// Add the click event to toggle the display state of the div
	$(".toggle_employees_list").on("click", function(){
		$(".col-contacts-border").toggle();

		  // Get the new display state of the div
		displayState = $(".col-contacts-border").css("display");

		  // Store the new display state of the div in localStorage
		localStorage.setItem(localStorageKey, displayState);
	});	

	$(document).on("click", ".chat-audio", function() {
	    var $this = $(this);
	    var $img = $this.find("img");
	    var $chatResponse = $this.closest(".message-info").find(".message-text .chat-response");
	    var play = $img.attr("data-play") == "true";

	    if (play) {
	        cancelSpeechSynthesis();
	    }

	    $img.attr({
	        "src": "../img/btn_tts_" + (play ? "play" : "stop") + ".svg",
	        "data-play": play ? "false" : "true"
	    });

	    if (!play) {
	        cancelSpeechSynthesis();

	        // Remove botão de cópia do texto antes de sintetizar a fala
	        var chatResponseText = $chatResponse.html().replace(/<button\b[^>]*\bclass="[^"]*\bcopy-code\b[^"]*"[^>]*>.*?<\/button>/ig, "");

	        // Verifica se o recurso é suportado antes de chamar a função
	        if ('speechSynthesis' in window) {
	            doSpeechSynthesis(chatResponseText, $chatResponse);
	        }
	    }
	});

	function cleanString(str) {
		str = str.trim()
		.replace(/<[^>]*>/g, "")
		.replace(/[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}|\u{1F900}-\u{1F9FF}|\u{1F1E0}-\u{1F1FF}|\u{1F200}-\u{1F2FF}|\u{1F700}-\u{1F77F}|\u{1F780}-\u{1F7FF}|\u{1F800}-\u{1F8FF}|\u{1F900}-\u{1F9FF}|\u{1FA00}-\u{1FA6F}|\u{1FA70}-\u{1FAFF}]/gu, '')
		.replace(/<div\s+class="date-chat".*?<\/div>/g, '')
		.replace(/\n/g, '');
		return str;
	}


	function cancelSpeechSynthesis(){
		window.speechSynthesis.cancel();
	}		


	function doSpeechSynthesis(longText, chatResponse) {

		$("span.chat-response-highlight").each(function() {
			$(this).replaceWith($(this).text());
		});	

		longText = cleanString(longText);

	  // The maximum number of characters in each part
		const maxLength = 100;

	  // Find the indices of punctuation marks in the longText string
		const punctuationIndices = [...longText.matchAll(/[,.?!]/g)].map(match => match.index);

	  // Divide the text into smaller parts at the punctuation marks
		const textParts = [];
		let startIndex = 0;
		for (let i = 0; i < punctuationIndices.length; i++) {
			if (punctuationIndices[i] - startIndex < maxLength) {
				continue;
			}
			textParts.push(longText.substring(startIndex, punctuationIndices[i] + 1));
			startIndex = punctuationIndices[i] + 1;
		}
		if (startIndex < longText.length) {
			textParts.push(longText.substring(startIndex));
		}


		const utterances = textParts.map(textPart => {
			const utterance = new SpeechSynthesisUtterance(textPart);
			utterance.lang = google_voice_lang_code;
			utterance.voice = speechSynthesis.getVoices().find(voice => voice.name === google_voice);

			if (!utterance.voice) {
				const backupVoice = array_voices.find(voice => voice.lang === utterance.lang);
				if (backupVoice) {
					utterance.voice = speechSynthesis.getVoices().find(voice => voice.name === backupVoice.name);
				}
			}

			return utterance;
		});


	  // Define the end of speech event
		utterances[utterances.length - 1].addEventListener("end", () => {
			$(".chat-audio img").attr("src", "../img/btn_tts_play.svg");
			$(".chat-audio img").attr("data-play", "false");
		});

		let firstChat = false;
			// Read each piece of text sequentially
		function speakTextParts(index = 0) {
			if (index < utterances.length) {
				const textToHighlight = textParts[index];
				const highlightIndex = longText.indexOf(textToHighlight);

			    // Highlight the text
				chatResponse.html(chatResponse.html().replace(textToHighlight, `<span class="chat-response-highlight">${textToHighlight}</span>`));

			    // Speak the text
				speechSynthesis.speak(utterances[index]);
				utterances[index].addEventListener("end", () => {
			      // Remove the highlight
					chatResponse.html(chatResponse.html().replace(`<span class="chat-response-highlight">${textToHighlight}</span>`, textToHighlight));
					speakTextParts(index + 1);
				});

			    // Remove the highlight if speech synthesis is interrupted
				speechSynthesis.addEventListener('pause', () => {
					chatResponse.html(chatResponse.html().replace(`<span class="chat-response-highlight">${textToHighlight}</span>`, textToHighlight));
				}, {once: true});
			}
		}

		  // Begin speak
		speakTextParts();
	}

	window.speechSynthesis.onvoiceschanged = function() {
		getTextToSpeechVoices();  
	};

	function displayVoices(){
		console.table(array_voices)
	}

	function getTextToSpeechVoices(){
		window.speechSynthesis.getVoices().forEach(function(voice) {
			const voiceObj = {
				name: voice.name,
				lang: voice.lang
			};
			array_voices.push(voiceObj);
		});			
	}


		//Show and hide password fields
	document.addEventListener("DOMContentLoaded", function() {
		const togglePasswordIcon = document.querySelector(".toggle-password");

		if (togglePasswordIcon) {
			togglePasswordIcon.addEventListener("click", function() {
				const passwordInput = document.getElementById("floatingPassword");
				const passwordType = passwordInput.getAttribute("type");

				if (passwordType === "password") {
					passwordInput.setAttribute("type", "text");
					togglePasswordIcon.classList.remove("bi-eye-slash");
					togglePasswordIcon.classList.add("bi-eye");
				} else {
					passwordInput.setAttribute("type", "password");
					togglePasswordIcon.classList.remove("bi-eye");
					togglePasswordIcon.classList.add("bi-eye-slash");
				}
			});
		}
	});

		//Password Strength
	document.addEventListener('DOMContentLoaded', function() {
		const passwordInput = document.getElementById('floatingPassword');
		const passwordStrengthBar = document.getElementById('password-strength-bar');
		const passwordStrengthText = document.getElementById('password-strength-text');

		if (passwordInput && passwordStrengthBar && passwordStrengthText) {
			passwordInput.addEventListener('input', function(event) {
				const password = event.target.value;
				const passwordStrength = checkPasswordStrength(password);

				passwordStrengthBar.style.width = passwordStrength.percentage + '%';
				passwordStrengthBar.classList.remove('bg-danger', 'bg-warning', 'bg-success');
				passwordStrengthBar.classList.add(passwordStrength.class);

				passwordStrengthText.textContent = passwordStrength.message;
			});
		}

		function checkPasswordStrength(password) {
			const minLength = 6;
			const strongRegex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})');
			const mediumRegex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{6,})');

			if (password.length < minLength) {
				return {
					percentage: 0,
					class: 'bg-danger',
					message: lang.password_have_6_char
				};
			}

			if (strongRegex.test(password)) {
				return {
					percentage: 100,
					class: 'bg-success',
					message: lang.password_entered_strong
				};
			}

			if (mediumRegex.test(password)) {
				return {
					percentage: 50,
					class: 'bg-warning',
					message: lang.password_entered_medium
				};
			}

			return {
				percentage: 25,
				class: 'bg-danger',
				message: lang.password_entered_medium
			};
		}
	});


	function updateCredits() {
		const pulseEffect = document.querySelector('.my-credits');
		if (pulseEffect) {
			pulseEffect.classList.add('pulse-animation');
			setTimeout(() => {
				pulseEffect.classList.remove('pulse-animation');
			}, 2000);

			fetch('/modules/customer/customer-get-credits.php')
			.then(response => response.json())
			.then(data => {
				if (data.error) {
					console.log(data.message);
				} else {
					const myCreditsDiv = document.querySelector('.my-credits');
					if (myCreditsDiv) {
						myCreditsDiv.textContent = lang['my_credits'] +": "+ data.credits;
					}
				}
			})
			.catch(error => console.log(error));
		} else {
			console.log("Element with class 'my-credits' not found.");
		}
	}


	var purchaseButtons = document.getElementsByClassName('purchase-btn');

	function showPaymentOptions(button) {
		if (button.getAttribute('data-single-payment-method') === 'true') {
			redirectToSinglePaymentMethod(button);
		} else {
			var paymentOptions = button.parentElement.querySelector('.payment-options');
			var allPaymentOptions = document.querySelectorAll('.payment-options:not(.d-none)');

			for (var i = 0; i < allPaymentOptions.length; i++) {
				if (allPaymentOptions[i] !== paymentOptions) {
					allPaymentOptions[i].classList.add('d-none');
				}
			}

			paymentOptions.classList.toggle('d-none');
		}
	}

	function redirectToSinglePaymentMethod(button) {
		var id = button.getAttribute('data-id');
		var href = button.getAttribute('data-href');
		var payment_method = '';

		if (stripeButtons.length) {
			payment_method = 'stripe';
		} else if (bankDepositButtons.length) {
			payment_method = 'bank_deposit';
		}

		if (payment_method) {
	        // Desabilite todos os botões, exceto o botão clicado e adicione o efeito de spinner
			disableAllButtonsExcept(button);

	        // Redirecionar o usuário com um pequeno atraso para mostrar o efeito de spinner
			setTimeout(function () {
				window.location.href = href + '/' + id + '?payment_method=' + payment_method;
			}, 1000);
		}
	}

	function disableAllButtonsExcept(clickedButton) {
		for (var i = 0; i < purchaseButtons.length; i++) {
			var button = purchaseButtons[i];
			button.disabled = true;
			if (button === clickedButton) {
				button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> '+lang.loading;
			}
		}
	}

	function disableAllButtons() {
		for (var i = 0; i < purchaseButtons.length; i++) {
			purchaseButtons[i].disabled = true;
			purchaseButtons[i].innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> '+lang.loading;
			purchaseButtons[i].parentElement.querySelector('.payment-options').classList.add('d-none');
		}
	}

	for (var i = 0; i < purchaseButtons.length; i++) {
		purchaseButtons[i].addEventListener('click', function(event) {
			event.preventDefault();
			showPaymentOptions(this);
		});
	}

	var stripeButtons = document.getElementsByClassName('stripe-btn');
	var bankDepositButtons = document.getElementsByClassName('bank-deposit-btn');

	for (var i = 0; i < stripeButtons.length; i++) {
		stripeButtons[i].addEventListener('click', function(event) {
			event.preventDefault();
			disableAllButtons();
			var id = this.parentElement.parentElement.querySelector('.purchase-btn').getAttribute('data-id');
			window.location.href = this.parentElement.parentElement.querySelector('.purchase-btn').getAttribute('data-href') + '/' + id + '?payment_method=stripe';
		});
	}

	for (var i = 0; i < bankDepositButtons.length; i++) {
		bankDepositButtons[i].addEventListener('click', function(event) {
			event.preventDefault();
			disableAllButtons();
			var id = this.parentElement.parentElement.querySelector('.purchase-btn').getAttribute('data-id');
			window.location.href = this.parentElement.parentElement.querySelector('.purchase-btn').getAttribute('data-href') + '/' + id + '?payment_method=bank_deposit';
		});
	}

	var closeButtons = document.getElementsByClassName('close-payment-options');

	for (var i = 0; i < closeButtons.length; i++) {
		closeButtons[i].addEventListener('click', function(event) {
			event.preventDefault();
			var paymentOptions = this.parentElement;
			paymentOptions.classList.add('d-none');
		});
	}

	document.addEventListener('DOMContentLoaded', function() {
		var categoryForm = document.getElementById('categoryForm');

		if (categoryForm) {
			categoryForm.addEventListener('submit', function(e) {
	      e.preventDefault(); // Impede o envio do formulário padrão
	      
	      var selectElement = document.getElementById('categoryAI');
	      var selectedValue = selectElement.value;
	      
	      if (selectedValue !== '') {
	      	window.location.href = selectedValue;
	      }
	    });
		}
	});


	function scrollToFirstInvalidField() {
		const firstInvalidField = document.querySelector('form .form-control:invalid');
		if (firstInvalidField) {
			firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}

	document.addEventListener('DOMContentLoaded', function() {
		var formElement = document.querySelector('form');
		var submitButton = document.getElementById('submit-button');

		if (formElement) {
			formElement.addEventListener('submit', function (event) {
				if (!event.target.checkValidity()) {
					event.preventDefault();
					event.stopPropagation();
					scrollToFirstInvalidField();
				} else {
	        // Adiciona o spinner somente se o formulário é válido
	        // Desabilita o botão
					submitButton.disabled = true;
	        // Altera o texto do botão para o spinner
					submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> '+lang.loading;
				}
				event.target.classList.add('was-validated');
			}, false);
		}
	});

		//Dall-e
	function appendChatImg(chat){
		const imageID = Date.now();
		IAimagePrompt = chat.replace("/img ","");

		$("#overflow-chat").append(
			"<div class='conversation-thread thread-ai'>" +
				"<div class='message-container'>" +
					"<div class='message-info'>" +
						"<div class='user-name'>" +
							"<h5>" + AI.name + "</h5>" +
						"</div>" +
						"<div class='message-text'>" +
							"<div class='chat-response no-white-space'>" +
								"<p>" + lang.creating_ia_image + " <strong class='ia-image-prompt-label'>" + IAimagePrompt + "</strong>" +
									"<div class='wrapper-image-ia image_ia_" + imageID + "'>" +
										"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='40' height='40'>" +
											"<circle cx='50' cy='50' r='40' stroke='#c5c5c5' stroke-width='8' fill='none' />" +
											"<circle cx='50' cy='50' r='40' stroke='#249ef7' stroke-width='8' fill='none' stroke-dasharray='250' stroke-dashoffset='0'>" +
												"<animate attributeName='stroke-dashoffset' dur='2s' repeatCount='indefinite' from='0' to='250' />" +
											"</circle>" +
										"</svg>" +
									"</div>" +
								"</p>" +
							"</div>" +
						"</div>" +
					"</div>" +
					"<div class='date-chat'>" +
						"<img src='../img/icon-clock.svg'> " + currentDate() +
					"</div>" +
				"</div>" +
			"</div>"
		);


		scrollChatBottom();
		$("#chat").val("");	

		const data = {
			ai_id: AI.id,
			prompt: IAimagePrompt
		};

		fetch(DALLE_PHP_url, {
			method: 'POST',
			body: JSON.stringify(data),
			headers: {
				'Content-Type': 'application/json'
			}
		})
		.then(response => response.json())
		.then(data => {
			console.log('response')
			if (data.status == 1) {
				$(".wrapper-image-ia svg").remove();
				const images = data.message.data;
				for (let i = 0; i < images.length; i++) {
					$(".image_ia_"+imageID).append(`<div class="image-ia"><img onerror="this.src='img/no-image.svg'" src="${images[i].url}"></div>`)
				}
				const imageUrls = images.map(image => image.url);
				scrollChatBottom();	
				enableChat();
				updateSessionChat(AI.slug);
				updateCredits();

			} else{
				toastr.error("❌ "+data.message)
				enableChat();
			}
		})			
	}

	//Adjust chat height
	$(".ai-contacts-scroll").height($(".ai-contacts-scroll").height() + $(".col-options-input").height())

	// Verifique o estado inicial do modo dark
	if (localStorage.getItem("dark-mode") === "true") {
		document.body.classList.add("dark-mode");
		updateThemeIcon(true);
	}

	var toggleButton = document.querySelector("#toggle-button");
	if (toggleButton) {
		toggleButton.addEventListener("click", function () {
			document.body.classList.toggle("dark-mode");
			var isDarkMode = document.body.classList.contains("dark-mode");
			localStorage.setItem("dark-mode", isDarkMode);
			updateThemeIcon(isDarkMode);
		});
	}

	function updateThemeIcon(isDarkMode) {
		var themeIcon = document.querySelector("#theme-icon");

		if (themeIcon) {
			if (isDarkMode) {
				themeIcon.className = 'bi bi-moon-stars fs-4';
			} else {
				themeIcon.className = 'bi bi-sun fs-4';
			}
		}
	}


	$(document).ready(function(){
		$('#showAll').click(function (e) {
			e.preventDefault();
			$('.hidden-card').show();
			$('.hidden-card img').each(function() {
				$(this).attr('src', $(this).attr('data-src'));
			});
			$('#showAll').remove();
		});

		  //Use suggestion
		$('.use-suggestion').click(function(){
				var suggestionText = $(this).parent().clone()    //clone the element
				.find('span') //find the span
				.remove()   //remove the span
				.end()  //again go back to selected element
				.text().trim();   //get the text of element
				$('#modalSuggestion').modal('hide');
				$('#chat').val(suggestionText);
				  window.scrollTo(0, document.body.scrollHeight);
			    $('#chat').addClass('pulse-animation').delay(2000).queue(function() {
			    $(this).removeClass('pulse-animation').dequeue();
			  });				  

			});

		$("#loading").fadeOut('slow');
	});

	//Chat mobile sticky top
	const aiChatTop = document.querySelector('.ai-chat-top');
	if(aiChatTop) {
	    window.addEventListener('scroll', () => {
	        if (window.pageYOffset > 130 && document.documentElement.scrollHeight > 1200) {
	            if (!aiChatTop.classList.contains('ai-chat-top-sticky')) {
	                aiChatTop.classList.add('ai-chat-top-sticky');
	            }
	        } else if (window.pageYOffset < 120) {
	            aiChatTop.style.top = "0";
	            aiChatTop.classList.remove('ai-chat-top-sticky');
	        }
	    });
	}

	//Share chat
	function shareChat(url) {
	    if(url == "not logged") {
	        toastr.error(`${lang.share_chat_message}`);
	    } else {
	        var textArea = document.createElement("textarea");
	        textArea.value = url;
	        document.body.appendChild(textArea);
	        textArea.focus();
	        textArea.select();
	        try {
	            var successful = document.execCommand('copy');
	            if(successful) {
	                toastr.success(`${lang.share_chat_copy_clipboard}`);
	            } else {
	                toastr.error('Failed to copy URL');
	            }
	        } catch (err) {
	            toastr.error('Failed to copy URL');
	            console.error('Failed to copy', err);
	        }
	        document.body.removeChild(textArea);
	    }
	}

	//Check share button
	checkShareButtonDisplay();

	function checkShareButtonDisplay(){
	    var shareDivCount = document.getElementsByClassName('conversation-thread').length;
	    if(shareDivCount > 1){
	        var element = document.getElementsByClassName("chat-action-buttons")[0];
	        element.style.opacity = "1";       
	    }
	}

	//Check Cookies 
	$(document).ready(function () {
	    let cookieStatus = localStorage.getItem('cookies');
	    if (cookieStatus === 'denied' || cookieStatus === null) {
	        $("#cookie-banner").css("display", "flex");
	    }

	    $("#accept-button").click(function () {
	        localStorage.setItem('cookies', 'accepted');
	        $("#cookie-banner").css("display", "none");
	    });

	    $("#deny-button").click(function () {
	        localStorage.setItem('cookies', 'denied');
	        $("#cookie-banner").css("display", "none");
	    });
	});


