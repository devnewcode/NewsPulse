const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const Cluster = require('./models/Cluster');
const Article = require('./models/Article');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/newspulse';

app.use(cors());
app.use(express.json());

// In-memory tracker for background scraper jobs
const jobs = new Map();

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB error:', err.message));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// GET /clusters - List of topic clusters
app.get('/clusters', async (req, res, next) => {
  try {
    const { source } = req.query;
    const query = source ? { sources: source } : {};
    const clusters = await Cluster.find(query).sort({ startTime: -1 });

    res.json({
      success: true,
      count: clusters.length,
      data: clusters,
    });
  } catch (err) {
    next(err);
  }
});

// GET /clusters/:id - Full cluster details with articles sorted chronologically
app.get('/clusters/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid cluster id' });
    }

    const cluster = await Cluster.findById(id);
    if (!cluster) {
      return res.status(404).json({ error: 'Cluster not found' });
    }

    const articles = await Article.find({ clusterId: id })
      .sort({ publishedAt: 1 })
      .select('title summary fullText source url publishedAt');

    res.json({
      success: true,
      data: { ...cluster.toObject(), articles },
    });
  } catch (err) {
    next(err);
  }
});

// GET /timeline - Clusters formatted for timeline plotting
app.get('/timeline', async (req, res, next) => {
  try {
    const { source } = req.query;
    const query = source ? { sources: source } : {};
    const clusters = await Cluster.find(query).sort({ startTime: 1 });

    const timelineData = clusters.map((c) => {
      const startMs = new Date(c.startTime).getTime();
      const endMs = new Date(c.endTime).getTime();
      const durationHours = Math.max(1, Math.round(((endMs - startMs) / (1000 * 60 * 60)) * 10) / 10);

      return {
        id: c._id,
        label: c.label,
        representativeHeadline: c.representativeHeadline,
        startTime: c.startTime,
        endTime: c.endTime,
        durationHours,
        articleCount: c.articleCount,
        intensity: c.articleCount,
        sources: c.sources,
        keywords: c.keywords,
      };
    });

    res.json({
      success: true,
      count: timelineData.length,
      data: timelineData,
    });
  } catch (err) {
    next(err);
  }
});

// POST /ingest/trigger - Starts Python scraper in background
app.post('/ingest/trigger', (req, res) => {
  const jobId = uuidv4();
  const pythonPath = process.env.PYTHON_PATH || 'python';
  const scriptPath = path.resolve(__dirname, '../scraper/main.py');

  jobs.set(jobId, { id: jobId, status: 'running', startedAt: new Date() });

  const py = spawn(pythonPath, [scriptPath], {
    cwd: path.resolve(__dirname, '../scraper'),
    env: { ...process.env, MONGODB_URI },
  });

  py.on('close', (code) => {
    const job = jobs.get(jobId);
    if (!job) return;
    job.status = code === 0 ? 'completed' : 'failed';
    job.completedAt = new Date();
  });

  py.on('error', (err) => {
    const job = jobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error = err.message;
    }
  });

  res.status(202).json({ success: true, jobId, status: 'running' });
});

// GET /ingest/status/:jobId - Poll job status
app.get('/ingest/status/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json({ success: true, data: job });
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
