import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Collapse,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

function ScanResults({ results }) {
  const [selectedTab, setSelectedTab] = useState(0);
  const [expandedItems, setExpandedItems] = useState({});

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const toggleExpand = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return <ErrorIcon color="error" />;
      case 'medium':
        return <WarningIcon color="warning" />;
      case 'low':
        return <InfoIcon color="info" />;
      default:
        return <CheckCircleIcon color="success" />;
    }
  };

  const renderNetworkResults = () => (
    <List>
      {results.network?.open_ports?.map((port, index) => (
        <React.Fragment key={index}>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={`Port ${port.port} (${port.service})`}
              secondary={`État: ${port.state}`}
            />
          </ListItem>
          <Divider />
        </React.Fragment>
      ))}
    </List>
  );

  const renderVulnerabilityResults = () => (
    <List>
      {results.vulnerabilities?.map((vuln, index) => (
        <React.Fragment key={index}>
          <ListItem>
            <ListItemIcon>
              {getSeverityIcon(vuln.severity)}
            </ListItemIcon>
            <ListItemText
              primary={vuln.name}
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {vuln.description}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={vuln.severity}
                      color={getSeverityColor(vuln.severity)}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={`CVE: ${vuln.cve_id}`}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </Box>
              }
            />
            <IconButton onClick={() => toggleExpand(`vuln-${index}`)}>
              {expandedItems[`vuln-${index}`] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </ListItem>
          <Collapse in={expandedItems[`vuln-${index}`]} timeout="auto" unmountOnExit>
            <Box sx={{ pl: 4, pr: 2, pb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Détails techniques
              </Typography>
              <Typography variant="body2" paragraph>
                {vuln.technical_details}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Solution recommandée
              </Typography>
              <Typography variant="body2">
                {vuln.recommendation}
              </Typography>
            </Box>
          </Collapse>
          <Divider />
        </React.Fragment>
      ))}
    </List>
  );

  const renderNetworkAnalysisResults = () => (
    <List>
      {results.network_analysis?.protocols?.map((protocol, index) => (
        <React.Fragment key={index}>
          <ListItem>
            <ListItemIcon>
              <InfoIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={protocol.name}
              secondary={`${protocol.packets} paquets, ${protocol.bytes} octets`}
            />
            <IconButton onClick={() => toggleExpand(`proto-${index}`)}>
              {expandedItems[`proto-${index}`] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </ListItem>
          <Collapse in={expandedItems[`proto-${index}`]} timeout="auto" unmountOnExit>
            <Box sx={{ pl: 4, pr: 2, pb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Statistiques
              </Typography>
              <Typography variant="body2" paragraph>
                {Object.entries(protocol.stats).map(([key, value]) => (
                  <Box key={key} sx={{ mb: 1 }}>
                    <strong>{key}:</strong> {value}
                  </Box>
                ))}
              </Typography>
            </Box>
          </Collapse>
          <Divider />
        </React.Fragment>
      ))}
    </List>
  );

  return (
    <Paper sx={{ width: '100%', mt: 2 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab label="Réseau" />
          <Tab label="Vulnérabilités" />
          <Tab label="Analyse Réseau" />
        </Tabs>
      </Box>
      <Box sx={{ p: 2 }}>
        {selectedTab === 0 && renderNetworkResults()}
        {selectedTab === 1 && renderVulnerabilityResults()}
        {selectedTab === 2 && renderNetworkAnalysisResults()}
      </Box>
    </Paper>
  );
}

export default ScanResults; 