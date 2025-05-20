import React, { useState, useEffect, useRef } from 'react';
import {
    Container,
    Paper,
    Grid,
    Typography,
    TextField,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Menu,
    Avatar,
    Badge,
    Tooltip
} from '@mui/material';
import {
    Send as SendIcon,
    AttachFile as AttachFileIcon,
    Add as AddIcon,
    Download as DownloadIcon,
    MoreVert as MoreVertIcon,
    Logout as LogoutIcon,
    Group as GroupIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axios from '../utils/axios';

// Custom styled components
const StyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        backgroundColor: '#44b700',
        color: '#44b700',
        boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    }
}));

const MessageBubble = styled(Box)(({ theme, ownmessage }) => ({
    maxWidth: '70%',
    backgroundColor: ownmessage ? theme.palette.primary.light : theme.palette.grey[200],
    padding: theme.spacing(1.5, 2),
    borderRadius: ownmessage 
        ? '18px 18px 0 18px' 
        : '18px 18px 18px 0',
    position: 'relative',
    wordBreak: 'break-word',
    boxShadow: theme.shadows[1]
}));

const Chat = () => {
    const [rooms, setRooms] = useState([]);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [users, setUsers] = useState([]);
    const [newRoomDialog, setNewRoomDialog] = useState(false);
    const [newRoomData, setNewRoomData] = useState({
        name: '',
        chat_type: 'private',
        participant_ids: []
    });
    const [messageMenuAnchor, setMessageMenuAnchor] = useState(null);
    const [selectedMessage, setSelectedMessage] = useState(null);
    
    const wsRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const isManager = currentUser?.user_type === 'manager';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    const handleMessageMenuOpen = (event, message) => {
        event.stopPropagation();
        setMessageMenuAnchor(event.currentTarget);
        setSelectedMessage(message);
    };

    const handleMessageMenuClose = () => {
        setMessageMenuAnchor(null);
        setSelectedMessage(null);
    };

    const handleDeleteForMe = async (messageId) => {
        try {
            await axios.post(`/api/messages/${messageId}/delete_for_me/`);
            setMessages(messages.filter(msg => msg.id !== messageId));
        } catch (error) {
            console.error('Error deleting message:', error);
        }
        handleMessageMenuClose();
    };

    const handleDeleteForEveryone = async (messageId) => {
        try {
            await axios.post(`/api/messages/${messageId}/delete_for_everyone/`);
            setMessages(messages.map(msg => 
                msg.id === messageId 
                    ? { ...msg, deleted_for_everyone: true, content: 'This message was deleted' }
                    : msg
            ));
        } catch (error) {
            console.error('Error deleting message:', error);
        }
        handleMessageMenuClose();
    };

    const fetchRooms = async () => {
        try {
            const response = await axios.get('/api/chatrooms/');
            setRooms(response.data);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        }
    };

    const fetchAvailableUsers = async () => {
        try {
            const response = await axios.get('/api/chatrooms/available_users/');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleDownload = async (message) => {
        try {
            const response = await axios.get(`/api/messages/${message.id}/download/`, {
                responseType: 'blob'
            });
            
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = message.file_name;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading file:', error);
        }
    };

    const connectWebSocket = (roomId) => {
        const ws = new WebSocket(`ws://localhost:8000/ws/chat/${roomId}/`);
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'delete_for_everyone') {
                setMessages(prev => prev.map(msg => 
                    msg.id === data.message_id 
                        ? { ...msg, deleted_for_everyone: true, content: 'This message was deleted' }
                        : msg
                ));
            } else {
                setMessages(prev => [...prev, data]);
            }
            scrollToBottom();
        };

        wsRef.current = ws;
        return () => ws.close();
    };

    const handleRoomSelect = async (room) => {
        setCurrentRoom(room);
        try {
            const response = await axios.get(`/api/messages/?room=${room.id}`);
            setMessages(response.data);
            connectWebSocket(room.id);
            scrollToBottom();
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleFileSelect = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || !currentRoom) return;

        const formData = new FormData();
        if (newMessage.trim()) {
            formData.append('content', newMessage);
        }
        if (selectedFile) {
            formData.append('file', selectedFile);
        }
        formData.append('room', currentRoom.id);

        try {
            const response = await axios.post('/api/messages/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            
            setMessages([...messages, response.data]);
            setNewMessage('');
            setSelectedFile(null);
            scrollToBottom();
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleCreateRoom = async () => {
        try {
            const response = await axios.post('/api/chatrooms/', newRoomData);
            setRooms([...rooms, response.data]);
            setNewRoomDialog(false);
            setNewRoomData({ name: '', chat_type: 'private', participant_ids: [] });
        } catch (error) {
            console.error('Error creating room:', error);
        }
    };

    useEffect(() => {
        fetchRooms();
        fetchAvailableUsers();
    }, []);

    return (
        <Container maxWidth="xl" sx={{ height: '100vh', p: 0 }}>
            <Grid container spacing={0} sx={{ height: '100%' }}>
                {/* Chat Rooms Sidebar - Wider */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={3} sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        borderRadius: 0,
                        overflow: 'hidden'
                    }}>
                        <Box sx={{ 
                            p: 2, 
                            bgcolor: 'primary.main', 
                            color: 'primary.contrastText',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>Chat Rooms</Typography>
                            <Box>
                                <Tooltip title="New Chat">
                                    <IconButton 
                                        color="inherit" 
                                        onClick={() => setNewRoomDialog(true)}
                                        sx={{ mr: 1 }}
                                    >
                                        <AddIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Logout">
                                    <IconButton 
                                        color="inherit" 
                                        onClick={handleLogout}
                                    >
                                        <LogoutIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                        
                        <Box sx={{ flex: 1, overflow: 'auto' }}>
                            <List dense>
                                {rooms.map((room) => (
                                    <ListItem
                                        key={room.id}
                                        button
                                        selected={currentRoom?.id === room.id}
                                        onClick={() => handleRoomSelect(room)}
                                        sx={{
                                            '&.Mui-selected': {
                                                backgroundColor: 'primary.lighter',
                                            },
                                            '&:hover': {
                                                backgroundColor: 'action.hover',
                                            }
                                        }}
                                    >
                                        <Avatar sx={{ 
                                            mr: 2,
                                            bgcolor: room.chat_type === 'group' ? 'secondary.main' : 'primary.main'
                                        }}>
                                            {room.chat_type === 'group' ? <GroupIcon /> : <PersonIcon />}
                                        </Avatar>
                                        <ListItemText
                                            primary={
                                                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                                    {room.name}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography variant="caption" color="textSecondary">
                                                    {room.chat_type} chat
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    </Paper>
                </Grid>

                {/* Chat Messages - Narrower */}
                <Grid item xs={12} md={8}>
                    <Paper elevation={3} sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        borderRadius: 0,
                        overflow: 'hidden'
                    }}>
                        {currentRoom ? (
                            <>
                                <Box sx={{ 
                                    p: 2, 
                                    bgcolor: 'background.paper',
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    <Avatar sx={{ 
                                        mr: 2,
                                        bgcolor: currentRoom.chat_type === 'group' ? 'secondary.main' : 'primary.main'
                                    }}>
                                        {currentRoom.chat_type === 'group' ? <GroupIcon /> : <PersonIcon />}
                                    </Avatar>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                        {currentRoom.name}
                                    </Typography>
                                </Box>
                                
                                <Box sx={{ 
                                    flex: 1, 
                                    overflow: 'auto', 
                                    p: 2,
                                    bgcolor: 'background.default',
                                    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9))',
                                    position: 'relative'
                                }}>
                                    <Box sx={{ 
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        overflow: 'auto',
                                        p: 2
                                    }}>
                                        <List sx={{ width: '100%' }}>
                                            {messages.map((message, index) => (
                                                <ListItem
                                                    key={index}
                                                    sx={{
                                                        justifyContent: message.sender.id === currentUser.id ? 'flex-end' : 'flex-start',
                                                        alignItems: 'flex-start',
                                                        py: 0.5
                                                    }}
                                                >
                                                    <MessageBubble ownmessage={message.sender.id === currentUser.id}>
                                                        {message.sender.id !== currentUser.id && (
                                                            <Typography 
                                                                variant="caption" 
                                                                color="textSecondary"
                                                                sx={{ 
                                                                    display: 'block',
                                                                    fontWeight: 500,
                                                                    mb: 0.5
                                                                }}
                                                            >
                                                                {message.sender.username}
                                                            </Typography>
                                                        )}
                                                        
                                                        {message.deleted_for_everyone ? (
                                                            <Typography 
                                                                variant="body2" 
                                                                sx={{ 
                                                                    fontStyle: 'italic', 
                                                                    color: 'text.secondary' 
                                                                }}
                                                            >
                                                                This message was deleted
                                                            </Typography>
                                                        ) : (
                                                            <>
                                                                {message.content && (
                                                                    <Typography variant="body1">{message.content}</Typography>
                                                                )}
                                                                {message.file_url && (
                                                                    <Box sx={{ 
                                                                        display: 'flex', 
                                                                        alignItems: 'center', 
                                                                        mt: 1,
                                                                        bgcolor: 'background.paper',
                                                                        borderRadius: 1,
                                                                        p: 1
                                                                    }}>
                                                                        <AttachFileIcon sx={{ mr: 1, fontSize: 'small' }} />
                                                                        <Typography 
                                                                            variant="body2"
                                                                            sx={{ 
                                                                                flex: 1,
                                                                                overflow: 'hidden',
                                                                                textOverflow: 'ellipsis',
                                                                                whiteSpace: 'nowrap'
                                                                            }}
                                                                        >
                                                                            {message.file_name}
                                                                        </Typography>
                                                                        <Tooltip title="Download">
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={() => handleDownload(message)}
                                                                                color="primary"
                                                                                sx={{ ml: 1 }}
                                                                            >
                                                                                <DownloadIcon fontSize="small" />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    </Box>
                                                                )}

                                                                <Tooltip title="Options">
                                                                    <IconButton
                                                                        size="small"
                                                                        sx={{
                                                                            position: 'absolute',
                                                                            top: 4,
                                                                            right: 4,
                                                                            opacity: 0,
                                                                            '&:hover': { opacity: 1 },
                                                                            transition: 'opacity 0.2s'
                                                                        }}
                                                                        onClick={(e) => handleMessageMenuOpen(e, message)}
                                                                    >
                                                                        <MoreVertIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </>
                                                        )}
                                                    </MessageBubble>
                                                </ListItem>
                                            ))}
                                            <div ref={messagesEndRef} />
                                        </List>
                                    </Box>
                                </Box>
                                
                                {/* Message Input - Enhanced */}
                                <Box 
                                    component="form" 
                                    onSubmit={handleSendMessage} 
                                    sx={{ 
                                        p: 2, 
                                        borderTop: '1px solid',
                                        borderColor: 'divider',
                                        bgcolor: 'background.paper',
                                        position: 'sticky',
                                        bottom: 0
                                    }}
                                >
                                    <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        gap: 1
                                    }}>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            style={{ display: 'none' }}
                                            onChange={handleFileSelect}
                                        />
                                        <Tooltip title="Attach file">
                                            <IconButton
                                                color="primary"
                                                onClick={() => fileInputRef.current.click()}
                                            >
                                                <AttachFileIcon />
                                            </IconButton>
                                        </Tooltip>
                                        {selectedFile && (
                                            <Chip
                                                label={selectedFile.name}
                                                onDelete={() => setSelectedFile(null)}
                                                size="small"
                                            />
                                        )}
                                        <TextField
                                            fullWidth
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            variant="outlined"
                                            size="small"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 20,
                                                    bgcolor: 'background.default'
                                                }
                                            }}
                                        />
                                        <Tooltip title="Send">
                                            <IconButton 
                                                type="submit" 
                                                color="primary"
                                                disabled={!newMessage.trim() && !selectedFile}
                                                sx={{ 
                                                    bgcolor: 'primary.main',
                                                    color: 'primary.contrastText',
                                                    '&:hover': {
                                                        bgcolor: 'primary.dark'
                                                    },
                                                    '&:disabled': {
                                                        bgcolor: 'action.disabledBackground'
                                                    }
                                                }}
                                            >
                                                <SendIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </Box>
                            </>
                        ) : (
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center', 
                                height: '100%',
                                flexDirection: 'column',
                                textAlign: 'center',
                                p: 4
                            }}>
                                <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                                    Select a chat to start messaging
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Or create a new chat using the button in the sidebar
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* New Room Dialog - Enhanced */}
            <Dialog 
                open={newRoomDialog} 
                onClose={() => setNewRoomDialog(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle sx={{ 
                    bgcolor: 'primary.main', 
                    color: 'primary.contrastText',
                    fontWeight: 600
                }}>
                    Create New Chat
                </DialogTitle>
                <DialogContent sx={{ py: 3 }}>
                    <TextField
                        fullWidth
                        label="Chat Name"
                        value={newRoomData.name}
                        onChange={(e) => setNewRoomData({ ...newRoomData, name: e.target.value })}
                        sx={{ mb: 3 }}
                        variant="outlined"
                        margin="dense"
                    />
                    {isManager && (
                        <FormControl fullWidth sx={{ mb: 3 }} variant="outlined" margin="dense">
                            <InputLabel>Chat Type</InputLabel>
                            <Select
                                value={newRoomData.chat_type}
                                onChange={(e) => setNewRoomData({ ...newRoomData, chat_type: e.target.value })}
                                label="Chat Type"
                            >
                                <MenuItem value="private">
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <PersonIcon sx={{ mr: 1, fontSize: 'small' }} />
                                        Private Chat
                                    </Box>
                                </MenuItem>
                                <MenuItem value="group">
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <GroupIcon sx={{ mr: 1, fontSize: 'small' }} />
                                        Group Chat
                                    </Box>
                                </MenuItem>
                            </Select>
                        </FormControl>
                    )}
                    <FormControl fullWidth variant="outlined" margin="dense">
                        <InputLabel>Participants</InputLabel>
                        <Select
                            multiple
                            value={newRoomData.participant_ids}
                            onChange={(e) => setNewRoomData({ ...newRoomData, participant_ids: e.target.value })}
                            label="Participants"
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((userId) => {
                                        const user = users.find(u => u.id === userId);
                                        return (
                                            <Chip 
                                                key={userId} 
                                                label={user?.username} 
                                                size="small" 
                                            />
                                        );
                                    })}
                                </Box>
                            )}
                        >
                            {users.map((user) => (
                                <MenuItem key={user.id} value={user.id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <StyledBadge
                                            overlap="circular"
                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                            variant="dot"
                                        >
                                            <Avatar 
                                                sx={{ 
                                                    width: 24, 
                                                    height: 24, 
                                                    mr: 2,
                                                    fontSize: '0.75rem'
                                                }}
                                            >
                                                {user.username.charAt(0).toUpperCase()}
                                            </Avatar>
                                        </StyledBadge>
                                        <Box>
                                            <Typography variant="body2">{user.username}</Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {user.user_type}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button 
                        onClick={() => setNewRoomDialog(false)}
                        variant="outlined"
                        sx={{ mr: 1 }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleCreateRoom} 
                        variant="contained"
                        disabled={!newRoomData.name || newRoomData.participant_ids.length === 0}
                    >
                        Create Chat
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Message Options Menu */}
            <Menu
                anchorEl={messageMenuAnchor}
                open={Boolean(messageMenuAnchor)}
                onClose={handleMessageMenuClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    elevation: 3,
                    sx: {
                        minWidth: 180,
                        borderRadius: 2
                    }
                }}
            >
                <MenuItem 
                    onClick={() => handleDeleteForMe(selectedMessage?.id)}
                    sx={{ color: 'error.main' }}
                >
                    Delete for me
                </MenuItem>
                {selectedMessage?.sender.id === currentUser.id && (
                    <MenuItem 
                        onClick={() => handleDeleteForEveryone(selectedMessage?.id)}
                        sx={{ color: 'error.main' }}
                    >
                        Delete for everyone
                    </MenuItem>
                )}
            </Menu>
        </Container>
    );
};

export default Chat;