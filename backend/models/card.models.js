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
        columnId: {
            type: String,
            default: function () {
                return this.list || 'todo';
            },
            index: true,
        },
        orderKey: {
            type: Number,
            required: true,
            default: 1000,
        },
        position: {
            type: Number,
            default: 0,
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
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
    },
    { timestamps: true }
);

// Compound unique index preventing duplicate orderKeys within the same column
cardSchema.index({ columnId: 1, orderKey: 1 }, { unique: true });
cardSchema.index({ board: 1, columnId: 1, orderKey: 1 });
cardSchema.index({ board: 1, orderKey: 1 });

module.exports = mongoose.model('Card', cardSchema);
