const express = require('express');
const router = express.Router();
const asyncHandler = require('../../src/utils/asyncHandler');
const ApiResponse = require('../../src/utils/apiResponse');
const adminService = require('../services/admin/admin.service');

// GET /api/settings/public - Unauthenticated public store configurations
router.get('/public', asyncHandler(async (req, res) => {
    const publicSettings = await adminService.getPublicSettings();
    res.status(200).json(
        ApiResponse.success(publicSettings, 'Public settings retrieved successfully')
    );
}));

module.exports = router;
