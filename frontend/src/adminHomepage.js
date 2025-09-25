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
import MenuItem from "@mui/material/MenuItem";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

import { brandOptions, categoryOptions, driverOptions } from "./options";

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
  const [openAdd, setOpenAdd] = useState(false);
  const [addRoom, setAddRoom] = useState({ buildingId: "", roomName: "" });
  const [currentDevice, setCurrentDevice] = useState(null);
  const [editForm, setEditForm] = useState({
    ip_address: "",
    device_category: "",
    device_driver: ""
  });
  const [newDevice, setNewDevice] = useState({
    ip_address: "",
    device_brand: "",
    device_category: "",
    device_driver: "",
    functionalities: []
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

  const handleEditOpen = (device, buildingId, roomNumber) => {
    setCurrentDevice({
      ...device,
      building_id: buildingId,
      room_number: roomNumber
    });
    setEditForm({
      ip_address: device.ip_address,
      device_category: device.device_category,
      device_driver: device.device_driver,
      device_brand: device.device_brand
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
          building_id: currentDevice.building_id, // must be a string
          room_number: currentDevice.room_number, // must be a string
          device_brand: currentDevice.device_brand,
          ip_address: editForm.ip_address,
          device_category: editForm.device_category,
          device_driver: editForm.device_driver
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
      alert("Server error on update");
    }
  };

  const handleDelete = async (buildingId, roomName, deviceName) => {
    if (!window.confirm(`Delete ${deviceName}?`)) return;
    try {
      const params = new URLSearchParams({
        building_id: buildingId,
        room_name: roomName,
        device_brand: deviceName
      });
      const response = await fetch(`http://127.0.0.1:8000/device/delete?${params.toString()}`, {
        method: "DELETE"
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

  const addDevice = async (building_id, room_number, device) => {
    await fetch("http://localhost:8000/device/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        building_id,
        room_number,
        ip_address: device.ip_address,
        device_brand: device.device_brand,
        device_category: device.device_category,
        device_driver: device.device_driver,
        functionalities: device.functionalities || []
      })
    });
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
                <h3 style={{ display: "flex", alignItems: "center" }}>
                  {r.room_number}
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={() => {
                      setAddRoom({ buildingId: b._id, roomName: r.room_number });
                      setOpenAdd(true);
                    }}
                    style={{ marginLeft: 8 }}
                  >
                    <AddIcon />
                  </IconButton>
                </h3>
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
                          <TableCell>{d.device_brand}</TableCell>
                          <TableCell>{d.device_category}</TableCell>
                          <TableCell>{d.ip_address}</TableCell>
                          <TableCell>
                            {d.device_driver
                              ? d.device_driver.split(/[\\/]/).pop().replace(/\.js$/, "")
                              : ""}
                          </TableCell>
                          <TableCell>
                            <IconButton color="primary" onClick={() => handleEditOpen(d, b._id, r.room_number)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton color="error" onClick={() => handleDelete(b._id, r.room_number, d.device_brand)}>
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

      {/* Add Device Modal */}
      <Modal open={openAdd} onClose={() => setOpenAdd(false)}>
        <Box sx={modalStyle}>
          <h2>Add Device</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await addDevice(addRoom.buildingId, addRoom.roomName, newDevice);
                alert("Device added!");
                setNewDevice({ ip_address: "", device_brand: "", device_category: "", device_driver: "", functionalities: [] });
                setOpenAdd(false);
                refreshData();
              } catch (err) {
                alert(err.message);
              }
            }}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <TextField
              label="IP Address"
              value={newDevice.ip_address}
              onChange={e => setNewDevice({ ...newDevice, ip_address: e.target.value })}
              required
            />
            <TextField
              label="Brand"
              select
              value={newDevice.device_brand}
              onChange={e => setNewDevice({ ...newDevice, device_brand: e.target.value })}
              required
            >
              {brandOptions.map(option => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Category"
              select
              value={newDevice.device_category}
              onChange={e => setNewDevice({ ...newDevice, device_category: e.target.value })}
              required
            >
              {categoryOptions.map(option => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Driver"
              select
              value={newDevice.device_driver}
              onChange={e => setNewDevice({ ...newDevice, device_driver: e.target.value })}
              required
            >
              {driverOptions.map(option => (
                <MenuItem key={option} value={option}>
                  {option.split(/[\\/]/).pop().replace(/\.js$/, "")}
                </MenuItem>
              ))}
            </TextField>
            <Button type="submit" variant="contained" color="primary">
              Add Device
            </Button>
            <Button onClick={() => setOpenAdd(false)} variant="outlined" color="secondary">
              Cancel
            </Button>
          </form>
        </Box>
      </Modal>

      {/* Options Modal */}
      <Modal open={openOptions} onClose={handleOptionsClose}>
        <Box sx={modalStyle}>
          <h2>{currentDevice?.device_brand} - Actions</h2>
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
            label="Brand"
            select
            fullWidth
            margin="normal"
            value={editForm.device_brand}
            onChange={e => setEditForm({ ...editForm, device_brand: e.target.value })}
            required
          >
            {brandOptions.map(option => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Category"
            select
            fullWidth
            margin="normal"
            value={editForm.device_category}
            onChange={e => setEditForm({ ...editForm, device_category: e.target.value })}
            required
          >
            {categoryOptions.map(option => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Driver"
            select
            fullWidth
            margin="normal"
            value={editForm.device_driver}
            onChange={e => setEditForm({ ...editForm, device_driver: e.target.value })}
            required
          >
            {driverOptions.map(option => (
              <MenuItem key={option} value={option}>
                {option.split(/[\\/]/).pop().replace(/\.js$/, "")}
              </MenuItem>
            ))}
          </TextField>
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
