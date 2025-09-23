import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Modal,
  Box,
  IconButton,
  TextField
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: "12px",
  minWidth: 300
};

function Homepage() {
  const [buildings, setBuildings] = useState([]);
  const [openOptions, setOpenOptions] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [currentDevice, setCurrentDevice] = useState(null);
  const [editForm, setEditForm] = useState({
    ip_address: "",
    device_category: "",
    device_driver: ""
  });

  useEffect(() => {
    fetch("http://127.0.0.1:8000/homeadmin")
      .then(res => res.json())
      .then(data => setBuildings(data.buildings || []))
      .catch(() => console.log("Failed to load homepage."));
  }, []);

  const refreshData = () => {
    fetch("http://127.0.0.1:8000/homeadmin")
      .then(res => res.json())
      .then(data => setBuildings(data.buildings || []));
  };

  const handleOptionsOpen = (device) => {
    setCurrentDevice(device);
    setOpenOptions(true);
  };
  const handleOptionsClose = () => setOpenOptions(false);

  const handleEditOpen = (device, buildingId, roomName) => {
    setCurrentDevice({ ...device, building_id: buildingId, room_name: roomName });
    setEditForm({
      ip_address: device.ip_address,
      device_category: device.device_category,
      device_driver: device.device_driver
    });
    setOpenEdit(true);
  };
  const handleEditClose = () => setOpenEdit(false);

  const handleEditSave = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/device/edit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          building_id: currentDevice.building_id,
          room_name: currentDevice.room_name,
          device_name: currentDevice.device_name,
          ...editForm
        })
      });
      if (response.ok) {
        alert("Device updated!");
        setOpenEdit(false);
        refreshData();
      } else {
        const err = await response.json();
        alert(err.detail || "Update failed");
      }
    } catch (e) {
      console.error(e);
      alert("Server error on update");
    }
  };

  const handleDelete = async (buildingId, roomName, deviceName) => {
    if (!window.confirm(`Delete ${deviceName}?`)) return;
    try {
      const response = await fetch("http://127.0.0.1:8000/device/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ building_id: buildingId, room_name: roomName, device_name: deviceName })
      });
      if (response.ok) {
        alert("Device deleted!");
        refreshData();
      } else {
        const err = await response.json();
        alert(err.detail || "Delete failed");
      }
    } catch (e) {
      console.error(e);
      alert("Server error on delete");
    }
  };

  return (
    <div style={{ margin: "2rem", backgroundColor: "lavender", minHeight: "100vh", padding: "1rem" }}>
      <h1>Admin Homepage</h1>
      {buildings.map((b, i) => (
        b.building_name && (
          <div key={i} style={{ marginBottom: "2rem" }}>
            <h2>{b.building_name}</h2>
            {b.rooms.map((r, j) => (
              <div key={j} style={{ marginBottom: "1rem" }}>
                <h3>{r.room_name}</h3>
                <Table>
                  <TableHead bgcolor="#f0f0f0">
                    <TableRow>
                      <TableCell>Device Name</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>IP Address</TableCell>
                      <TableCell>Driver</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {r.devices.length > 0 ? (
                      r.devices.map((d, k) => (
                        <TableRow key={k}>
                          <TableCell>{d.device_name}</TableCell>
                          <TableCell>{d.device_category}</TableCell>
                          <TableCell>{d.ip_address}</TableCell>
                          <TableCell>{d.device_driver}</TableCell>
                          <TableCell>
                            <IconButton color="primary" onClick={() => handleEditOpen(d, b._id, r.room_name)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton color="error" onClick={() => handleDelete(b._id, r.room_name, d.device_name)}>
                              <DeleteIcon />
                            </IconButton>
                            <Button variant="contained" onClick={() => handleOptionsOpen(d)}>
                              Options
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">No devices available.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        )
      ))}

      {/* Options Modal */}
      <Modal open={openOptions} onClose={handleOptionsClose}>
        <Box sx={modalStyle}>
          <h2>{currentDevice?.device_name} - Actions</h2>
          <ul>
            {currentDevice?.functionalities?.map((f, idx) => (
              <li key={idx}>
                <Button variant="outlined" style={{ marginBottom: "0.5rem" }}>{f}</Button>
              </li>
            ))}
          </ul>
          <Button onClick={handleOptionsClose} variant="contained" color="secondary">
            Close
          </Button>
        </Box>
      </Modal>

      {/* Edit Modal */}
      <Modal open={openEdit} onClose={handleEditClose}>
        <Box sx={modalStyle}>
          <h2>Edit Device</h2>
          <TextField
            label="IP Address"
            fullWidth
            margin="normal"
            value={editForm.ip_address}
            onChange={e => setEditForm({ ...editForm, ip_address: e.target.value })}
          />
          <TextField
            label="Category"
            fullWidth
            margin="normal"
            value={editForm.device_category}
            onChange={e => setEditForm({ ...editForm, device_category: e.target.value })}
          />
          <TextField
            label="Driver"
            fullWidth
            margin="normal"
            value={editForm.device_driver}
            onChange={e => setEditForm({ ...editForm, device_driver: e.target.value })}
          />
          <Button onClick={handleEditSave} variant="contained" color="primary" style={{ marginTop: "1rem" }}>
            Save
          </Button>
          <Button onClick={handleEditClose} variant="outlined" color="secondary" style={{ marginTop: "1rem", marginLeft: "1rem" }}>
            Cancel
          </Button>
        </Box>
      </Modal>
    </div>
  );
}

export default Homepage;
