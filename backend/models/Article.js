const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      default: '',
    },
    fullText: {
      type: String,
      default: '',
    },
    source: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
      unique: true,
    },
    publishedAt: {
      type: Date,
      required: true,
    },
    clusterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cluster',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

articleSchema.index({ clusterId: 1, publishedAt: 1 });

module.exports = mongoose.model('Article', articleSchema);
