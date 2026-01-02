// AI Chatbot tích hợp đơn giản
class SimpleAIChat {
    constructor() {
        this.apiKey = "AIzaSyB-M8iwktpXsiAkS5pmvUcuNWKl8MzdN44";
        this.model = "gemini-2.5-pro";
    }

    // Gửi tin nhắn đến AI
    async askAI(question) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: question
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error('Lỗi kết nối API');
            }

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            return 'Xin lỗi, tôi không thể trả lời câu hỏi này lúc này.';
        }
    }

    // Hiển thị modal AI
    showAIModal() {
        // Tạo modal nếu chưa có
        let modal = document.getElementById('ai-modal');
        if (!modal) {
            modal = this.createAIModal();
            document.body.appendChild(modal);
        }
        
        modal.style.display = 'block';
        document.getElementById('ai-question').focus();
        
        // Thêm tin nhắn chào mừng nếu chưa có tin nhắn nào
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages && chatMessages.children.length === 0) {
            this.addMessage('Chào mừng bạn đến với shop len của ếch con! Hãy hỏi tôi nếu có bất kỳ khó khăn gì', 'ai');
        }
    }

    // Tạo modal AI
    createAIModal() {
        const modal = document.createElement('div');
        modal.id = 'ai-modal';
        modal.innerHTML = `
            <div class="ai-modal-overlay">
                <div class="ai-modal-content">
                    <div class="ai-modal-header">
                        <h3>EchConDamDang</h3>
                        <button class="ai-close-btn">&times;</button>
                    </div>
                    <div class="ai-modal-body">
                        <div id="ai-response" class="ai-response">
                            <div id="chat-messages"></div>
                        </div>
                        <div class="ai-input-group">
                            <input type="text" id="ai-question" placeholder="hãy thoải mái đặt câu hỏi nhé ...">
                            <button id="ai-ask-btn">Hỏi</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Thêm CSS
        const style = document.createElement('style');
        style.textContent = `
            .ai-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                pointer-events: none;
            }
            
            .ai-modal-overlay .ai-modal-content {
                pointer-events: auto;
            }
            
            .ai-modal-content {
                background: white;
                border-radius: 10px;
                width: 90%;
                max-width: 600px;
                max-height: 80vh;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }
            
            .ai-modal-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .ai-close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .ai-modal-body {
                padding: 20px;
            }
            
            .ai-response {
                min-height: 200px;
                max-height: 300px;
                overflow-y: auto;
                border: 1px solid #ddd;
                border-radius: 5px;
                padding: 15px;
                margin-bottom: 15px;
                background: #f9f9f9;
            }
            
            #chat-messages {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            /* Chat messages styling */
            .chat-message {
                margin-bottom: 15px;
                display: flex;
                align-items: flex-start;
            }
            
            .chat-message.user {
                justify-content: flex-start;
            }
            
            .chat-message.ai {
                justify-content: flex-end;
            }
            
            .message-bubble {
                max-width: 70%;
                padding: 12px 16px;
                border-radius: 18px;
                word-wrap: break-word;
                line-height: 1.4;
                position: relative;
            }
            
            .chat-message.user .message-bubble {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-bottom-left-radius: 4px;
            }
            
            .chat-message.ai .message-bubble {
                background: white;
                color: #333;
                border: 1px solid #e0e0e0;
                border-bottom-right-radius: 4px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .chat-message.error .message-bubble {
                background: #ffebee;
                color: #c62828;
                border: 1px solid #ffcdd2;
            }
            
            .message-time {
                font-size: 11px;
                color: #999;
                margin-top: 4px;
                text-align: right;
            }
            
            .chat-message.user .message-time {
                text-align: left;
            }
            
            .ai-input-group {
                display: flex;
                gap: 10px;
            }
            
            .ai-input-group input {
                flex: 1;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 5px;
                outline: none;
            }
            
            .ai-input-group button {
                padding: 10px 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
            }
            
            .ai-input-group button:hover {
                opacity: 0.9;
            }
            
            .ai-loading {
                text-align: center;
                color: #666;
                font-style: italic;
            }
            .user-response-text {
                
                color: #666;
                font-style: italic;
            }
        `;
        document.head.appendChild(style);

        // Thêm event listeners
        modal.querySelector('.ai-close-btn').onclick = () => {
            modal.style.display = 'none';
        };

        // modal.querySelector('.ai-modal-overlay').onclick = (e) => {
        //     if (e.target === modal.querySelector('.ai-modal-overlay')) {
        //         modal.style.display = 'none';
        //     }
        // };

        modal.querySelector('#ai-ask-btn').onclick = () => {
            
            this.handleAIQuestion();
        };

        modal.querySelector('#ai-question').onkeypress = (e) => {
            if (e.key === 'Enter') {
                this.handleAIQuestion();
            }
        };

        return modal;
    }

    // Thêm tính năng kéo thả modal
    addDragFunctionality(modal) {
        const modalContent = modal.querySelector('.ai-modal-content');
        const modalHeader = modal.querySelector('.ai-modal-header');
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        // Bắt đầu kéo
        modalHeader.addEventListener('mousedown', dragStart);

        // Kéo
        document.addEventListener('mousemove', drag);

        // Kết thúc kéo
        document.addEventListener('mouseup', dragEnd);

        // Touch events cho mobile
        modalHeader.addEventListener('touchstart', dragStart);
        document.addEventListener('touchmove', drag);
        document.addEventListener('touchend', dragEnd);

        function dragStart(e) {
            if (e.type === "touchstart") {
                initialX = e.touches[0].clientX - xOffset;
                initialY = e.touches[0].clientY - yOffset;
            } else {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
            }

            if (e.target === modalHeader || modalHeader.contains(e.target)) {
                isDragging = true;
                modalContent.classList.add('dragging');
            }
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();

                if (e.type === "touchmove") {
                    currentX = e.touches[0].clientX - initialX;
                    currentY = e.touches[0].clientY - initialY;
                } else {
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                }

                xOffset = currentX;
                yOffset = currentY;

                // Giới hạn kéo trong viewport
                const maxX = window.innerWidth - modalContent.offsetWidth;
                const maxY = window.innerHeight - modalContent.offsetHeight;

                currentX = Math.max(0, Math.min(currentX, maxX));
                currentY = Math.max(0, Math.min(currentY, maxY));

                modalContent.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        }

        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
            modalContent.classList.remove('dragging');
        }

        // Reset position khi đóng modal
        const originalCloseHandler = modal.querySelector('.ai-close-btn').onclick;
        modal.querySelector('.ai-close-btn').onclick = () => {
            modalContent.style.transform = 'translate(0px, 0px)';
            xOffset = 0;
            yOffset = 0;
            originalCloseHandler();
        };
    }

    // Xử lý câu hỏi AI
    async handleAIQuestion() {
        const questionInput = document.getElementById('ai-question');
        const chatMessages = document.getElementById('chat-messages');
        const askBtn = document.getElementById('ai-ask-btn');
        
        const question = questionInput.value.trim();
        if (!question) return;

        // Hiển thị câu hỏi của user (bên trái)
        this.addMessage(question, 'user');
        questionInput.value = '';
        
        // Hiển thị loading
        askBtn.textContent = 'Biết đợi không';
        askBtn.disabled = true;
        const loadingId = this.addMessage('Từ từ nghĩ cái má ơi ... 🤔', 'ai', true);

        try {
            const response = await this.askAI(question);
            // Xóa loading message và thêm response thật
            this.removeMessage(loadingId);
            this.addMessage(response, 'ai');
        } catch (error) {
            this.removeMessage(loadingId);
            this.addMessage('Có lỗi xảy ra khi kết nối AI.', 'error');
        } finally {
            askBtn.textContent = 'Hỏi';
            askBtn.disabled = false;
            
        }
    }

    // Thêm tin nhắn vào chat
    addMessage(content, type, isLoading = false) {
        const chatMessages = document.getElementById('chat-messages');
        const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}`;
        messageDiv.id = messageId;
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        bubbleDiv.textContent = content;
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = new Date().toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageDiv.appendChild(bubbleDiv);
        messageDiv.appendChild(timeDiv);
        chatMessages.appendChild(messageDiv);
        
        // Cuộn xuống tin nhắn mới nhất
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return messageId;
    }

    // Xóa tin nhắn
    removeMessage(messageId) {
        const message = document.getElementById(messageId);
        if (message) {
            message.remove();
        }
    }
}

// Khởi tạo AI
const aiChat = new SimpleAIChat();

// Thêm nút AI vào trang (nếu chưa có)
document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra xem đã có nút AI chưa
    if (!document.getElementById('ai-chat-btn')) {
        // Tạo nút AI
        const aiBtn = document.createElement('button');
        aiBtn.id = 'ai-chat-btn';
        aiBtn.innerHTML = 'Gợi ý';
        aiBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 20px;
            border-radius: 50px;
            cursor: pointer;
            font-weight: bold;
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
            z-index: 9999;
            transition: all 0.3s;
        `;
        
        aiBtn.onmouseover = () => {
            aiBtn.style.transform = 'translateY(-5px)';
            aiBtn.style.boxShadow = '0 8px 25px rgba(209, 147, 212, 0.6)';
        };
        
        aiBtn.onmouseout = () => {
            aiBtn.style.transform = 'translateY(5px)';
            aiBtn.style.boxShadow = '0 5px 15px rgba(102, 126, 234, 0.4)';
        };
        
        aiBtn.onclick = () => {
            aiChat.showAIModal();
        };
        
        document.body.appendChild(aiBtn);
    }
});
