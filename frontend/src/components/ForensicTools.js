import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Folder as FolderIcon,
  History as HistoryIcon,
  Memory as MemoryIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  BugReport as BugIcon,
  PlayArrow as PlayIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import axios from 'axios';

const forensicTools = [
  {
    id: 'files',
    title: 'Analyse des Fichiers',
    description: 'Liste des fichiers récents et analyse des timestamps',
    icon: <FolderIcon sx={{ fontSize: 40 }} />,
    color: '#2196f3',
    category: 'basic',
  },
  {
    id: 'shell_history',
    title: 'Historique Shell',
    description: 'Analyse des commandes shell récentes',
    icon: <HistoryIcon sx={{ fontSize: 40 }} />,
    color: '#4caf50',
    category: 'basic',
  },
  {
    id: 'processes',
    title: 'Processus',
    description: 'Analyse des processus en cours',
    icon: <MemoryIcon sx={{ fontSize: 40 }} />,
    color: '#f44336',
    category: 'basic',
  },
  {
    id: 'network_traffic',
    title: 'Trafic Réseau',
    description: 'Capture et analyse du trafic en temps réel',
    icon: <StorageIcon sx={{ fontSize: 40 }} />,
    color: '#ff9800',
    category: 'advanced',
  },
  {
    id: 'file_hashes',
    title: 'Hachages Fichiers',
    description: 'Calcul des hachages SHA256 des fichiers',
    icon: <SecurityIcon sx={{ fontSize: 40 }} />,
    color: '#9c27b0',
    category: 'advanced',
  },
  {
    id: 'rootkit_scan',
    title: 'Scan Rootkit',
    description: 'Détection des rootkits avec chkrootkit/rkhunter',
    icon: <BugIcon sx={{ fontSize: 40 }} />,
    color: '#e91e63',
    category: 'advanced',
  },
];

function ForensicTools() {
  const [selectedTool, setSelectedTool] = useState(null);
  const [scanDialog, setScanDialog] = useState({ open: false, tool: null });
  const [scanPath, setScanPath] = useState('');
  const [activeScans, setActiveScans] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleStartScan = (tool) => {
    setScanDialog({ open: true, tool });
  };

  const handleStopScan = async (scanId) => {
    try {
      await axios.post(`http://localhost:8000/api/v1/forensic/${scanId}/stop`);
      setActiveScans(prev => {
        const newScans = { ...prev };
        delete newScans[scanId];
        return newScans;
      });
      setSuccess('Analyse arrêtée avec succès');
    } catch (error) {
      setError('Erreur lors de l\'arrêt de l\'analyse');
    }
  };

  const handleScanSubmit = async () => {
    try {
      setError('');
      setSuccess('');
      
      const response = await axios.post('http://localhost:8000/api/v1/forensic/', {
        tool: scanDialog.tool,
        path: scanPath,
      });

      setActiveScans(prev => ({
        ...prev,
        [response.data.id]: response.data
      }));

      setSuccess('Analyse lancée avec succès');
      setScanDialog({ open: false, tool: null });
      setScanPath('');
    } catch (error) {
      setError(error.response?.data?.detail || 'Erreur lors du lancement de l\'analyse');
    }
  };

  const handleDownloadResults = async (scanId) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/v1/forensic/${scanId}/results`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `forensic_results_${scanId}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setError('Erreur lors du téléchargement des résultats');
    }
  };

  const renderToolCard = (tool) => (
    <Grid item xs={12} sm={6} md={4} key={tool.id}>
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
            <Box sx={{ color: tool.color, mr: 2 }}>
              {tool.icon}
            </Box>
            <Typography variant="h6" component="div">
              {tool.title}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {tool.description}
          </Typography>
          <Chip
            label={tool.category === 'basic' ? 'Basique' : 'Avancé'}
            color={tool.category === 'basic' ? 'primary' : 'secondary'}
            size="small"
            sx={{ mt: 2 }}
          />
        </CardContent>
        <CardActions>
          <Button
            size="small"
            startIcon={<PlayIcon />}
            onClick={() => handleStartScan(tool)}
          >
            Lancer
          </Button>
        </CardActions>
      </Card>
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
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
        Outils Forensic
      </Typography>

      <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Outils Basiques
      </Typography>
      <Grid container spacing={3}>
        {forensicTools
          .filter(tool => tool.category === 'basic')
          .map(renderToolCard)}
      </Grid>

      <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Outils Avancés
      </Typography>
      <Grid container spacing={3}>
        {forensicTools
          .filter(tool => tool.category === 'advanced')
          .map(renderToolCard)}
      </Grid>

      {Object.keys(activeScans).length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Analyses en cours
          </Typography>
          <List>
            {Object.entries(activeScans).map(([scanId, scan]) => (
              <ListItem
                key={scanId}
                secondaryAction={
                  <Box>
                    {scan.status === 'completed' && (
                      <IconButton
                        edge="end"
                        color="primary"
                        onClick={() => handleDownloadResults(scanId)}
                      >
                        <DownloadIcon />
                      </IconButton>
                    )}
                    {scan.status === 'running' && (
                      <IconButton
                        edge="end"
                        color="error"
                        onClick={() => handleStopScan(scanId)}
                      >
                        <CircularProgress size={24} />
                      </IconButton>
                    )}
                  </Box>
                }
              >
                <ListItemText
                  primary={forensicTools.find(t => t.id === scan.tool)?.title}
                  secondary={`Statut: ${scan.status}`}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      <Dialog open={scanDialog.open} onClose={() => setScanDialog({ open: false, tool: null })}>
        <DialogTitle>
          Lancer une analyse forensic
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Chemin à analyser"
            type="text"
            fullWidth
            value={scanPath}
            onChange={(e) => setScanPath(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScanDialog({ open: false, tool: null })}>
            Annuler
          </Button>
          <Button 
            onClick={handleScanSubmit}
            variant="contained"
            disabled={!scanPath}
          >
            Lancer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ForensicTools; 