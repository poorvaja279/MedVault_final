//controllers/accessController.js
const AccessRequest = require('../models/AccessRequest');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

// Search patient by ID (NEW)
exports.searchPatient = async (req, res) => {
    try {
        const { patientId } = req.params;
        
        const patient = await Patient.findOne({ patientId }).select('patientId fullName dob sex bloodGroup');
        
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        
        res.json({ patient });
    } catch (err) {
        console.error('Search patient error:', err);
        res.status(500).json({ error: 'Error searching patient' });
    }
};

// Request access (MODIFIED to support both access and upload)
exports.requestAccess = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { patientId, requestType } = req.body; // requestType: 'access' or 'upload'
        
        // Validate requestType
        if (!requestType || !['access', 'upload'].includes(requestType)) {
            return res.status(400).json({ error: 'Invalid request type. Must be "access" or "upload"' });
        }

        // Find patient by patientId string
        const patient = await Patient.findOne({ patientId });
        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        // Check existing request
        const existing = await AccessRequest.findOne({
            doctorId,
            patientId: patient._id,
            requestType
        });

        if (existing) {
            if (existing.status === 'pending') {
                return res.json({ message: `${requestType === 'access' ? 'Access' : 'Upload'} request already pending` });
            }
            
            if (existing.status === 'approved') {
                return res.json({ message: `${requestType === 'access' ? 'Access' : 'Upload'} already granted` });
            }
            
            // If rejected, allow new request
            existing.status = 'pending';
            await existing.save();
            return res.json({ message: `${requestType === 'access' ? 'Access' : 'Upload'} request resent` });
        }

        // Create new request
        const request = new AccessRequest({
            doctorId,
            patientId: patient._id,
            requestType
        });
        
        await request.save();
        res.json({ message: `${requestType === 'access' ? 'Access' : 'Upload'} request sent successfully` });
    } catch (err) {
        console.error('Request access error:', err);
        res.status(500).json({ error: 'Error sending request' });
    }
};

// Get patient's pending requests
exports.getPatientRequests = async (req, res) => {
    try {
        const patientId = req.user.id;
        const requests = await AccessRequest.find({ patientId, status: 'pending' })
            .populate('doctorId', 'name doctorId email specialty hospitalAddress');

        const formatted = requests.map(r => ({
            _id: r._id,
            doctorId: r.doctorId._id,
            doctorName: r.doctorId.name,
            doctorNMC: r.doctorId.doctorId,
            specialty: r.doctorId.specialty,
            hospital: r.doctorId.hospitalAddress,
            requestType: r.requestType || 'access',
            status: r.status,
            createdAt: r.createdAt
        }));

        res.json(formatted);
    } catch (err) {
        console.error('Get requests error:', err);
        res.status(500).json({ error: 'Error fetching requests' });
    }
};

// Patient responds to request
exports.respondToRequest = async (req, res) => {
    try {
        const patientId = req.user.id;
        const { requestId, action } = req.body;

        if (!['approved', 'rejected'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action' });
        }

        const request = await AccessRequest.findOne({ _id: requestId, patientId });
        if (!request) return res.status(404).json({ error: 'Request not found' });

        request.status = action;
        await request.save();

        res.json({ message: `Request ${action}` });
    } catch (err) {
        console.error('Respond error:', err);
        res.status(500).json({ error: 'Error updating request' });
    }
};

// Get doctor's approved patients (FIXED)
exports.getDoctorApprovedPatients = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const approved = await AccessRequest.find({ doctorId, status: 'approved' })
            .populate('patientId', 'fullName patientId dob sex bloodGroup');

        const patients = approved.map(r => ({
            _id: r.patientId._id,
            patientId: r.patientId.patientId,
            fullName: r.patientId.fullName,
            dob: r.patientId.dob,
            sex: r.patientId.sex,
            bloodGroup: r.patientId.bloodGroup
        }));

        res.json(patients);
    } catch (err) {
        console.error('Get approved error:', err);
        res.status(500).json({ error: 'Error fetching approved patients' });
    }
};

// Get pending requests count for doctor (NEW)
exports.getDoctorPendingCount = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const count = await AccessRequest.countDocuments({ doctorId, status: 'pending' });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching count' });
    }
};
