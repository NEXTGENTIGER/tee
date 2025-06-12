import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import axios from 'axios';

function NetworkScan() {
  const [target, setTarget] = useState('');
  const [scanType, setScanType] = useState('quick');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  const scanTypes = [
    { value: 'quick', label: 'Quick Scan' },
    { value: 'full', label: 'Full Scan' },
    { value: 'vulnerability', label: 'Vulnerability Scan' },
    { value: 'custom', label: 'Custom Scan' },
  ];

  const handleScan = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:8000/scan/network/', {
        target,
        scan_type: scanType,
      });
      setResults(response.data);
    } catch (error) {
      setError(error.response?.data?.detail || 'An error occurred during the scan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Network Scan
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Target (IP or Hostname)"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Scan Type</InputLabel>
              <Select
                value={scanType}
                label="Scan Type"
                onChange={(e) => setScanType(e.target.value)}
              >
                {scanTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={handleScan}
              disabled={loading || !target}
              startIcon={loading && <CircularProgress size={20} />}
            >
              Start Scan
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {results && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Scan Results
          </Typography>
          <Box
            component="pre"
            sx={{
              p: 2,
              bgcolor: 'background.paper',
              borderRadius: 1,
              overflow: 'auto',
            }}
          >
            {JSON.stringify(results, null, 2)}
          </Box>
        </Paper>
      )}
    </Container>
  );
}

export default NetworkScan; 