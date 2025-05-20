import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Avatar,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Profile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    bio: '',
    profile_picture: null,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUser(userData);
      setFormData({
        bio: userData.bio || '',
        profile_picture: null,
      });
    }
  }, []);

  const handleChange = (e) => {
    if (e.target.name === 'profile_picture') {
      setFormData({
        ...formData,
        profile_picture: e.target.files[0],
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('bio', formData.bio);
      if (formData.profile_picture) {
        data.append('profile_picture', formData.profile_picture);
      }

      const response = await axios.put(`/api/users/${user.id}/`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      localStorage.setItem('user', JSON.stringify(response.data));
      navigate('/');
    } catch (error) {
      console.error('Profile update failed:', error);
    }
  };

  if (!user) return null;

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center">
            Profile
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Avatar
              src={user.profile_picture}
              sx={{ width: 100, height: 100, mb: 2 }}
            />
            <Typography variant="h6">{user.username}</Typography>
            <Typography color="textSecondary">{user.user_type}</Typography>
          </Box>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              fullWidth
              name="bio"
              label="Bio"
              multiline
              rows={4}
              value={formData.bio}
              onChange={handleChange}
            />
            <Button variant="contained" component="label">
              Upload Profile Picture
              <input
                type="file"
                hidden
                name="profile_picture"
                onChange={handleChange}
                accept="image/*"
              />
            </Button>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Update Profile
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/')}
            >
              Back to Chat
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default Profile;