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
        attachments: {
            type: [
                {
                    originalName: { type: String, default: '' },
                    fileName: { type: String, default: '' },
                    mimeType: { type: String, default: '' },
                    size: { type: Number, default: 0 },
                    url: { type: String, default: '' },
                    createdAt: { type: Date, default: Date.now },
                },
            ],
            default: [],
        },
        comments: {
            type: [
                {
                    text: { type: String, required: true, trim: true, maxlength: 2000 },
                    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
                    authorName: { type: String, required: true, trim: true },
                    attachment: {
                        originalName: { type: String, default: '' },
                        fileName: { type: String, default: '' },
                        mimeType: { type: String, default: '' },
                        size: { type: Number, default: 0 },
                        url: { type: String, default: '' },
                    },
                    createdAt: { type: Date, default: Date.now },
                    updatedAt: { type: Date },
                },
            ],
            default: [],
        },
        activities: {
            type: [
                {
                    text: { type: String, required: true },
                    user: { type: String, required: true },
                    createdAt: { type: Date, default: Date.now },
                },
            ],
            default: [],
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Card', cardSchema);

