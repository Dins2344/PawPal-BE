const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const protect = require("../middlewares/auth");
const adminOnly = require("../middlewares/adminOnly");
const upload = require("../middlewares/upload");

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// ─── Pet Management ─────────────────────────────────────────────────────────
router.post("/pets", upload.single("image"), adminController.addPet);
router.get("/pets", adminController.getAllPets);
router.put("/pets/:petId", upload.single("image"), adminController.updatePet);
router.delete("/pets/:petId", adminController.deletePet);

// ─── Adoption Management ────────────────────────────────────────────────────
router.get("/adoptions", adminController.getAdoptionRequests);
router.put("/adoptions/:adoptionId/approve", adminController.approveAdoption);
router.put("/adoptions/:adoptionId/reject", adminController.rejectAdoption);

module.exports = router;
