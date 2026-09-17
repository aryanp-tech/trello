const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    backgroundImage: {
      type: String,
      default: '',
    },
    backgroundColor: {
      type: String,
      default: '#1d4ed8',
    },
    description: {
      type: String,
      default: '',
      maxlength: 500,
    },
    columns: {
      type: [
        {
          id: { type: String, required: true },
          label: { type: String, required: true, trim: true, maxlength: 40 },
        },
      ],
      default: [
        { id: 'todo', label: 'To Do' },
        { id: 'doing', label: 'Doing' },
        { id: 'done', label: 'Done' },
      ],
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isStarred: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Board', boardSchema);
