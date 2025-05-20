import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Container, Paper, Avatar, Link } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import axios from '../utils/axios';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            const response = await axios.post('/api/users/login/', formData);
            console.log('Login successful:', response.data);
            
            // Store user data in localStorage
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            // Redirect to chat
            navigate('/chat');
        } catch (error) {
            console.error('Login error:', error.response?.data || error.message);
            setError(error.response?.data?.error || 'Login failed. Please try again.');
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Paper
                elevation={6}
                sx={{
                    marginTop: 8,
                    padding: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    borderRadius: 2,
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                    backgroundColor: 'background.paper'
                }}
            >
                <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                    <LockOutlined />
                </Avatar>
                <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Sign in
                </Typography>
                
                {error && (
                    <Typography 
                        color="error" 
                        sx={{ 
                            mt: 1, 
                            mb: 2,
                            padding: '8px 16px',
                            backgroundColor: 'error.light',
                            borderRadius: 1,
                            width: '100%',
                            textAlign: 'center'
                        }}
                    >
                        {error}
                    </Typography>
                )}
                
                <Box 
                    component="form" 
                    onSubmit={handleSubmit} 
                    sx={{ 
                        width: '100%',
                        mt: 2 
                    }}
                >
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Username"
                        name="username"
                        autoComplete="username"
                        autoFocus
                        value={formData.username}
                        onChange={handleChange}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: 'grey.300',
                                },
                                '&:hover fieldset': {
                                    borderColor: 'primary.main',
                                },
                            }
                        }}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={formData.password}
                        onChange={handleChange}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: 'grey.300',
                                },
                                '&:hover fieldset': {
                                    borderColor: 'primary.main',
                                },
                            }
                        }}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{
                            mt: 3,
                            mb: 2,
                            py: 1.5,
                            borderRadius: 1,
                            textTransform: 'none',
                            fontSize: '1rem',
                            fontWeight: 'medium',
                            boxShadow: 'none',
                            '&:hover': {
                                boxShadow: 'none',
                                backgroundColor: 'primary.dark'
                            }
                        }}
                    >
                        Sign In
                    </Button>
                    
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        mt: 2
                    }}>
                        <Typography variant="body2" color="text.secondary">
                            Don't have an account?{' '}
                        </Typography>
                        <Link 
                            component="button"
                            variant="body2"
                            onClick={() => navigate('/register')}
                            sx={{
                                ml: 1,
                                color: 'primary.main',
                                textDecoration: 'none',
                                '&:hover': {
                                    textDecoration: 'underline',
                                    color: 'primary.dark'
                                }
                            }}
                        >
                            Sign Up
                        </Link>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default Login;