/**
 * Chat Page for ThinkSpace
 * 
 * This page provides the main chat interface with AI-powered conversations,
 * context awareness, and integration with PARA methodology components.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Stack,
  Title,
  Group,
  Button,
  Card,
  Text,
  TextInput,
  ActionIcon,
  ScrollArea,
  Avatar,
  Badge,
  Loader,
  Alert,
  Paper,
  Divider,
  Menu,
  Modal,
} from '@mantine/core';
import {
  IconSend,
  IconPlus,
  IconDots,
  IconTrash,
  IconEdit,
  IconMessageCircle,
  IconRobot,
  IconUser,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
  metadata?: {
    context?: string;
    attachments?: string[];
  };
}

interface Chat {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export default function ChatPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newChatModalOpened, { open: openNewChatModal, close: closeNewChatModal }] = useDisclosure(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Fetch chats
  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chat');
      
      if (response.ok) {
        const data = await response.json();
        setChats(data.data.chats);
        
        // Set first chat as active if none selected
        if (!activeChat && data.data.chats.length > 0) {
          setActiveChat(data.data.chats[0]);
          setMessages(data.data.chats[0].messages || []);
        }
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      setError('Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  // Create new chat
  const createNewChat = async () => {
    if (!newChatTitle.trim()) return;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newChatTitle,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newChat = data.data.chat;
        
        setChats(prev => [newChat, ...prev]);
        setActiveChat(newChat);
        setMessages([]);
        setNewChatTitle('');
        closeNewChatModal();
        
        notifications.show({
          title: 'Chat Created',
          message: 'New chat conversation started.',
          color: 'green',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to create new chat.',
        color: 'red',
      });
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChat || sending) return;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      content: newMessage,
      role: 'user',
      createdAt: new Date().toISOString(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setSending(true);

    try {
      // Simulate AI response (replace with actual AI integration)
      setTimeout(() => {
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          content: `I understand you're asking about: "${userMessage.content}". This is a simulated response. In the full implementation, this would connect to an AI service like OpenAI's GPT or a local LLM to provide intelligent responses based on your PARA methodology content.`,
          role: 'assistant',
          createdAt: new Date().toISOString(),
        };

        setMessages(prev => [...prev, aiMessage]);
        setSending(false);
      }, 1500);

    } catch (error) {
      console.error('Error sending message:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to send message.',
        color: 'red',
      });
      setSending(false);
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    fetchChats();
  }, []);

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (loading) {
    return (
      <Stack gap="lg" align="center" justify="center" h="50vh">
        <Loader size="lg" />
        <Text size="sm" c="dimmed">Loading chats...</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="lg" h="calc(100vh - 120px)">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Title order={1}>
            Chat
          </Title>
          <Text c="dimmed" size="sm">
            AI-powered conversations about your knowledge
          </Text>
        </div>
        
        <Button
          leftSection={<IconPlus size="1rem" />}
          onClick={openNewChatModal}
        >
          New Chat
        </Button>
      </Group>

      {error && (
        <Alert color="red" title="Error" icon={<IconAlertTriangle size="1rem" />}>
          {error}
        </Alert>
      )}

      <Group align="flex-start" gap="md" style={{ flex: 1, height: '100%' }}>
        {/* Chat Sidebar */}
        <Card padding="md" radius="md" withBorder style={{ width: 300, height: '100%' }}>
          <Stack gap="sm">
            <Text fw={600} size="sm">Recent Chats</Text>
            
            <ScrollArea style={{ height: 'calc(100vh - 300px)' }}>
              <Stack gap="xs">
                {chats.map((chat) => (
                  <Paper
                    key={chat.id}
                    p="sm"
                    radius="md"
                    style={{
                      cursor: 'pointer',
                      backgroundColor: activeChat?.id === chat.id 
                        ? 'var(--mantine-color-blue-light)' 
                        : 'transparent',
                      border: activeChat?.id === chat.id 
                        ? '1px solid var(--mantine-color-blue-6)' 
                        : '1px solid transparent',
                    }}
                    onClick={() => {
                      setActiveChat(chat);
                      setMessages(chat.messages || []);
                    }}
                  >
                    <Group justify="space-between" align="flex-start">
                      <Stack gap="xs" style={{ flex: 1 }}>
                        <Text size="sm" fw={500} lineClamp={1}>
                          {chat.title}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {formatTimeAgo(chat.updatedAt)}
                        </Text>
                      </Stack>

                      <Menu shadow="md" width={150}>
                        <Menu.Target>
                          <ActionIcon variant="subtle" size="sm">
                            <IconDots size="0.8rem" />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item leftSection={<IconEdit size="0.8rem" />}>
                            Rename
                          </Menu.Item>
                          <Menu.Item 
                            leftSection={<IconTrash size="0.8rem" />}
                            color="red"
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </ScrollArea>
          </Stack>
        </Card>

        {/* Chat Area */}
        <Card padding="md" radius="md" withBorder style={{ flex: 1, height: '100%' }}>
          {activeChat ? (
            <Stack gap="md" style={{ height: '100%' }}>
              {/* Chat Header */}
              <Group justify="space-between">
                <div>
                  <Text fw={600}>{activeChat.title}</Text>
                  <Text size="xs" c="dimmed">
                    {messages.length} messages
                  </Text>
                </div>
                
                <Badge variant="light" leftSection={<IconMessageCircle size="0.8rem" />}>
                  Active
                </Badge>
              </Group>

              <Divider />

              {/* Messages */}
              <ScrollArea 
                ref={scrollAreaRef}
                style={{ flex: 1, height: 'calc(100vh - 400px)' }}
              >
                <Stack gap="md" p="sm">
                  {messages.map((message) => (
                    <Group
                      key={message.id}
                      align="flex-start"
                      gap="sm"
                      justify={message.role === 'user' ? 'flex-end' : 'flex-start'}
                    >
                      {message.role === 'assistant' && (
                        <Avatar size="sm" color="blue">
                          <IconRobot size="1rem" />
                        </Avatar>
                      )}
                      
                      <Paper
                        p="sm"
                        radius="md"
                        style={{
                          maxWidth: '70%',
                          backgroundColor: message.role === 'user' 
                            ? 'var(--mantine-color-blue-6)' 
                            : 'var(--mantine-color-gray-1)',
                          color: message.role === 'user' ? 'white' : 'inherit',
                        }}
                      >
                        <Text size="sm">{message.content}</Text>
                        <Text 
                          size="xs" 
                          c={message.role === 'user' ? 'blue.1' : 'dimmed'}
                          mt="xs"
                        >
                          {formatTimeAgo(message.createdAt)}
                        </Text>
                      </Paper>

                      {message.role === 'user' && (
                        <Avatar size="sm" color="gray">
                          <IconUser size="1rem" />
                        </Avatar>
                      )}
                    </Group>
                  ))}
                  
                  {sending && (
                    <Group align="flex-start" gap="sm">
                      <Avatar size="sm" color="blue">
                        <IconRobot size="1rem" />
                      </Avatar>
                      <Paper p="sm" radius="md" style={{ backgroundColor: 'var(--mantine-color-gray-1)' }}>
                        <Group gap="xs">
                          <Loader size="xs" />
                          <Text size="sm" c="dimmed">AI is thinking...</Text>
                        </Group>
                      </Paper>
                    </Group>
                  )}
                  
                  <div ref={messagesEndRef} />
                </Stack>
              </ScrollArea>

              {/* Message Input */}
              <Group gap="sm">
                <TextInput
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  style={{ flex: 1 }}
                  disabled={sending}
                />
                <ActionIcon
                  size="lg"
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  color="blue"
                >
                  <IconSend size="1rem" />
                </ActionIcon>
              </Group>
            </Stack>
          ) : (
            <Stack gap="md" align="center" justify="center" style={{ height: '100%' }}>
              <IconMessageCircle size="3rem" color="var(--mantine-color-gray-5)" />
              <Text size="lg" fw={500}>No chat selected</Text>
              <Text size="sm" c="dimmed" ta="center">
                Select a chat from the sidebar or create a new one to start a conversation
              </Text>
              <Button leftSection={<IconPlus size="1rem" />} onClick={openNewChatModal}>
                Start New Chat
              </Button>
            </Stack>
          )}
        </Card>
      </Group>

      {/* New Chat Modal */}
      <Modal
        opened={newChatModalOpened}
        onClose={closeNewChatModal}
        title="Start New Chat"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Chat Title"
            placeholder="Enter a title for your chat..."
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                createNewChat();
              }
            }}
          />
          
          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={closeNewChatModal}>
              Cancel
            </Button>
            <Button onClick={createNewChat} disabled={!newChatTitle.trim()}>
              Create Chat
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
