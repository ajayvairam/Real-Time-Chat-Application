import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Paper,
    Avatar,
    Link
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import axios from '../utils/axios';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        user_type: '',
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
            const response = await axios.post('/api/users/register/', formData);
            console.log('Registration successful:', response.data);
            navigate('/login');
        } catch (error) {
            console.error('Registration error:', error.response?.data);
            if (error.response?.data) {
                const { errors, message } = error.response.data;
                
                if (errors) {
                    const errorMessages = Object.entries(errors)
                        .map(([field, messages]) => {
                            const messageText = Array.isArray(messages) ? messages.join(', ') : messages;
                            return `${field}: ${messageText}`;
                        })
                        .join('\n');
                    setError(errorMessages);
                } else if (message) {
                    setError(message);
                } else {
                    const errorMessages = Object.entries(error.response.data)
                        .map(([field, messages]) => {
                            const messageText = Array.isArray(messages) ? messages.join(', ') : messages;
                            return `${field}: ${messageText}`;
                        })
                        .join('\n');
                    setError(errorMessages);
                }
            } else {
                setError('Registration failed. Please try again.');
            }
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
                    <PersonAdd />
                </Avatar>
                <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Create Account
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
                            textAlign: 'center',
                            whiteSpace: 'pre-line'
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
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        value={formData.email}
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
                        autoComplete="new-password"
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
                    <FormControl 
                        fullWidth 
                        margin="normal"
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
                    >
                        <InputLabel id="user-type-label">User Type</InputLabel>
                        <Select
                            labelId="user-type-label"
                            id="user_type"
                            name="user_type"
                            value={formData.user_type}
                            label="User Type"
                            onChange={handleChange}
                            required
                        >
                            <MenuItem value="manager">Manager</MenuItem>
                            <MenuItem value="auditor">Auditor</MenuItem>
                            <MenuItem value="client">Client</MenuItem>
                        </Select>
                    </FormControl>
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
                        Register
                    </Button>
                    
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        mt: 2
                    }}>
                        <Typography variant="body2" color="text.secondary">
                            Already have an account?{' '}
                        </Typography>
                        <Link 
                            component="button"
                            variant="body2"
                            onClick={() => navigate('/login')}
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
                            Sign in
                        </Link>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default Register;