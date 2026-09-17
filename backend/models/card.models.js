const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema(
    {
        board: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Board',
            required: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
            maxlength: 120,
        },
        description: {
            type: String,
            default: '',
            maxlength: 2000,
            trim: true,
        },
        list: {
            type: String,
            default: 'todo',
        },
        position: {
            type: Number,
            default: 0,
        },
        attachment: {
            originalName: { type: String, default: '' },
            fileName: { type: String, default: '' },
            mimeType: { type: String, default: '' },
            size: { type: Number, default: 0 },
            url: { type: String, default: '' },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Card', cardSchema);

