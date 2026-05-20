const axios = require("axios");

const checkProjectMember = async (req, res, next) => {
    try {
        const { projectId } = req.body;
        
        if (!projectId) {
            return res.status(400).json({
                success: false,
                message: "projectId is required",
            });
        }

        // Call project-service to verify if user is member
        const response = await axios.get(
            `${process.env.PROJECT_SERVICE_URL}/api/projects/${projectId}/verify-member/${req.user.id}`,
            {
                headers: {
                    Authorization: req.headers.authorization,
                },
            }
        );

        if (!response.data.isMember) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this project",
            });
        }

        next();
    } catch (error) {
        console.error("Member verification failed:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to verify project membership",
        });
    }
};

module.exports = checkProjectMember;