const mongoose = require('mongoose');

const accessRequestSchema = new mongoose.Schema({
    doctorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Doctor', 
        required: true 
    },
    patientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Patient', 
        required: true 
    },
    requestType: {
        type: String,
        enum: ['access', 'upload'],
        default: 'access'
    },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('AccessRequest', accessRequestSchema);
