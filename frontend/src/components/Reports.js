import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import axios from 'axios';

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get('http://localhost:8000/reports/');
      setReports(response.data);
    } catch (error) {
      setError('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setViewDialogOpen(true);
  };

  const handleDownloadReport = async (reportId) => {
    try {
      const response = await axios.get(`http://localhost:8000/reports/${reportId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setError('Failed to download report');
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await axios.delete(`http://localhost:8000/reports/${reportId}`);
        setReports(reports.filter((report) => report.id !== reportId));
      } catch (error) {
        setError('Failed to delete report');
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Analysis Reports
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Scan Type</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{report.title}</TableCell>
                  <TableCell>{report.scan_type}</TableCell>
                  <TableCell>{report.target}</TableCell>
                  <TableCell>
                    {new Date(report.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => handleViewReport(report)}
                      color="primary"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDownloadReport(report.id)}
                      color="primary"
                    >
                      <DownloadIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteReport(report.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Report Details</DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedReport.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Scan Type: {selectedReport.scan_type}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Target: {selectedReport.target}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Date: {new Date(selectedReport.created_at).toLocaleString()}
              </Typography>
              <Box
                component="pre"
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  overflow: 'auto',
                }}
              >
                {JSON.stringify(selectedReport.results, null, 2)}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Reports; 