const mongoose = require('mongoose');

const clusterSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    articleCount: {
      type: Number,
      default: 1,
    },
    sources: {
      type: [String],
      default: [],
    },
    keywords: {
      type: [String],
      default: [],
    },
    representativeHeadline: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

clusterSchema.index({ startTime: -1 });

module.exports = mongoose.model('Cluster', clusterSchema);
