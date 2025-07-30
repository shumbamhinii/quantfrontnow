import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Bot, User } from 'lucide-react'
import { motion } from 'framer-motion'

interface Message {
  id: string
  content: string
  sender: 'user' | 'bot'
  timestamp: Date
}

export function ChatInterface () {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content:
        "Hello! I'm Qx Chat, your data assistant. I can help you analyze your business data, generate reports, and answer questions about your transactions, customers, and performance metrics. What would you like to know?",
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I understand you're asking about " +
          inputMessage +
          '. Based on your current data, I can help you analyze trends, generate insights, and provide recommendations. Would you like me to show you specific metrics or create a custom report?',
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Card className='h-full flex flex-col'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Bot className='h-5 w-5' />
          QuantChat - Your Data Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className='flex-1 flex flex-col space-y-4'>
        <ScrollArea className='flex-1 pr-4'>
          <div className='space-y-4'>
            {messages.map(message => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className='flex items-start gap-2'>
                    {message.sender === 'bot' && (
                      <Bot className='h-4 w-4 mt-1 flex-shrink-0' />
                    )}
                    {message.sender === 'user' && (
                      <User className='h-4 w-4 mt-1 flex-shrink-0' />
                    )}
                    <div>
                      <p className='text-sm'>{message.content}</p>
                      <p className='text-xs opacity-70 mt-1'>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className='flex justify-start'
              >
                <div className='bg-muted rounded-lg p-3'>
                  <div className='flex items-center gap-2'>
                    <Bot className='h-4 w-4' />
                    <div className='flex space-x-1'>
                      <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
                      <div
                        className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                        style={{ animationDelay: '0.1s' }}
                      ></div>
                      <div
                        className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        <div className='flex gap-2'>
          <Input
            placeholder='Ask me anything about your data...'
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className='flex-1'
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
          >
            <Send className='h-4 w-4' />
          </Button>
        </div>

        <div className='flex flex-wrap gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() =>
              setInputMessage('Show me my top customers this month')
            }
          >
            Top Customers
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() =>
              setInputMessage('Generate a sales report for the last quarter')
            }
          >
            Sales Report
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() =>
              setInputMessage('What are my profit margins by product?')
            }
          >
            Profit Analysis
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
