import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Security as SecurityIcon,
  NetworkCheck as NetworkIcon,
  BugReport as BugIcon,
  Storage as StorageIcon,
  Download as DownloadIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const scanTypes = [
  {
    id: 'full',
    title: 'Scan Complet',
    description: 'Exécute tous les scanners (réseau, vulnérabilités, analyse)',
    icon: <SecurityIcon sx={{ fontSize: 40 }} />,
    color: '#2196f3',
  },
  {
    id: 'network',
    title: 'Scan Réseau',
    description: 'Analyse des ports et services avec Nmap',
    icon: <NetworkIcon sx={{ fontSize: 40 }} />,
    color: '#4caf50',
  },
  {
    id: 'vulnerability',
    title: 'Scan de Vulnérabilités',
    description: 'Détection des vulnérabilités avec OWASP ZAP',
    icon: <BugIcon sx={{ fontSize: 40 }} />,
    color: '#f44336',
  },
  {
    id: 'network_analysis',
    title: 'Analyse Réseau',
    description: 'Capture et analyse du trafic avec Tshark',
    icon: <StorageIcon sx={{ fontSize: 40 }} />,
    color: '#ff9800',
  },
];

function Dashboard() {
  const { user } = useAuth();
  const [activeScans, setActiveScans] = useState({});
  const [scanDialog, setScanDialog] = useState({ open: false, type: null });
  const [target, setTarget] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleStartScan = async (scanType) => {
    setScanDialog({ open: true, type: scanType });
  };

  const handleStopScan = async (scanId) => {
    try {
      await axios.post(`http://localhost:8000/api/v1/scan/${scanId}/stop`);
      setActiveScans(prev => {
        const newScans = { ...prev };
        delete newScans[scanId];
        return newScans;
      });
      setSuccess('Scan arrêté avec succès');
    } catch (error) {
      setError('Erreur lors de l\'arrêt du scan');
    }
  };

  const handleScanSubmit = async () => {
    try {
      setError('');
      setSuccess('');
      
      const response = await axios.post('http://localhost:8000/api/v1/scan/', {
        scan_type: scanDialog.type,
        target: target,
        parameters: {
          ports: '1-10000',
          duration: 300
        }
      });

      setActiveScans(prev => ({
        ...prev,
        [response.data.id]: response.data
      }));

      setSuccess('Scan lancé avec succès');
      setScanDialog({ open: false, type: null });
      setTarget('');
    } catch (error) {
      setError(error.response?.data?.detail || 'Erreur lors du lancement du scan');
    }
  };

  const handleDownloadResults = async (scanId) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/v1/scan/${scanId}/results`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `scan_results_${scanId}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setError('Erreur lors du téléchargement des résultats');
    }
  };

  return (
    <Container maxWidth="lg">
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Security Toolbox
      </Typography>

      <Grid container spacing={3}>
        {scanTypes.map((scan) => (
          <Grid item xs={12} sm={6} md={3} key={scan.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)',
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: scan.color, mr: 2 }}>
                    {scan.icon}
                  </Box>
                  <Typography variant="h6" component="div">
                    {scan.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {scan.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<PlayIcon />}
                  onClick={() => handleStartScan(scan.id)}
                >
                  Lancer
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {Object.keys(activeScans).length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Scans en cours
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(activeScans).map(([scanId, scan]) => (
              <Grid item xs={12} key={scanId}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="subtitle1">
                        {scanTypes.find(s => s.id === scan.scan_type)?.title || scan.scan_type}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Cible: {scan.target}
                      </Typography>
                    </Box>
                    <Box>
                      <Chip
                        label={scan.status}
                        color={
                          scan.status === 'completed' ? 'success' :
                          scan.status === 'failed' ? 'error' :
                          'primary'
                        }
                        sx={{ mr: 1 }}
                      />
                      {scan.status === 'completed' && (
                        <IconButton
                          color="primary"
                          onClick={() => handleDownloadResults(scanId)}
                        >
                          <DownloadIcon />
                        </IconButton>
                      )}
                      {scan.status === 'running' && (
                        <IconButton
                          color="error"
                          onClick={() => handleStopScan(scanId)}
                        >
                          <StopIcon />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Dialog open={scanDialog.open} onClose={() => setScanDialog({ open: false, type: null })}>
        <DialogTitle>
          Lancer un nouveau scan
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Cible (IP ou domaine)"
            type="text"
            fullWidth
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScanDialog({ open: false, type: null })}>
            Annuler
          </Button>
          <Button 
            onClick={handleScanSubmit}
            variant="contained"
            disabled={!target}
          >
            Lancer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Dashboard; 