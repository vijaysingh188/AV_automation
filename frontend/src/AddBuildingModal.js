import React, { useState } from "react";
import { Modal, Box, TextField, Button, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "#6e6868ff",
  color: "#fff",
  boxShadow: 24,
  p: 4,
  borderRadius: "12px",
  minWidth: 400
};

function AddBuildingModal({ open, handleClose, refreshBuildings }) {
  const [buildingName, setBuildingName] = useState("");
  const [rooms, setRooms] = useState([
    { room_name: "", devices: [{ device_name: "", device_category: "", ip_address: "", device_driver: "" }] }
  ]);

  const handleRoomChange = (index, field, value) => {
    const newRooms = [...rooms];
    newRooms[index][field] = value;
    setRooms(newRooms);
  };

  const handleDeviceChange = (roomIndex, deviceIndex, field, value) => {
    const newRooms = [...rooms];
    newRooms[roomIndex].devices[deviceIndex][field] = value;
    setRooms(newRooms);
  };

  const addRoom = () => setRooms([...rooms, { room_name: "", devices: [{ device_name: "", device_category: "", ip_address: "", device_driver: "" }] }]);
  const addDevice = (roomIndex) => {
    const newRooms = [...rooms];
    newRooms[roomIndex].devices.push({ device_name: "", device_category: "", ip_address: "", device_driver: "" });
    setRooms(newRooms);
  };

  const handleSubmit = async () => {
    const payload = {
      building_name: buildingName,
      rooms: rooms.map(r => ({
        room_name: r.room_name,
        devices: r.devices.map(d => ({ ...d, functionalities: ["ON/OFF", "Pressure Low/High"] }))
      }))
    };

    const response = await fetch("http://127.0.0.1:8000/add-building", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (response.ok) {
      refreshBuildings();
      handleClose();
      setBuildingName("");
      setRooms([{ room_name: "", devices: [{ device_name: "", device_category: "", ip_address: "", device_driver: "" }] }]);
    } else {
      alert(data.detail || "Failed to add building");
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={modalStyle}>
        <h2>Add New Building</h2>
        <TextField
          fullWidth
          label="Building Name"
          value={buildingName}
          onChange={e => setBuildingName(e.target.value)}
          margin="normal"
          sx={{ input: { color: "#fff" }, label: { color: "#bbb" } }}
        />

        {rooms.map((room, ri) => (
          <Box key={ri} sx={{ border: "1px solid #333", p: 2, mb: 2, borderRadius: "8px" }}>
            <TextField
              fullWidth
              label={`Room Name ${ri + 1}`}
              value={room.room_name}
              onChange={e => handleRoomChange(ri, "room_name", e.target.value)}
              margin="normal"
              sx={{ input: { color: "#fff" }, label: { color: "#bbb" } }}
            />
            {room.devices.map((device, di) => (
              <Box key={di} sx={{ display: "flex", gap: 1, mb: 1 }}>
                <TextField
                  label="Device Name"
                  value={device.device_name}
                  onChange={e => handleDeviceChange(ri, di, "device_name", e.target.value)}
                  sx={{ input: { color: "#fff" }, label: { color: "#bbb" } }}
                />
                <TextField
                  label="Category"
                  value={device.device_category}
                  onChange={e => handleDeviceChange(ri, di, "device_category", e.target.value)}
                  sx={{ input: { color: "#fff" }, label: { color: "#bbb" } }}
                />
                <TextField
                  label="IP Address"
                  value={device.ip_address}
                  onChange={e => handleDeviceChange(ri, di, "ip_address", e.target.value)}
                  sx={{ input: { color: "#fff" }, label: { color: "#bbb" } }}
                />
                <TextField
                  label="Driver"
                  value={device.device_driver}
                  onChange={e => handleDeviceChange(ri, di, "device_driver", e.target.value)}
                  sx={{ input: { color: "#fff" }, label: { color: "#bbb" } }}
                />
              </Box>
            ))}
            <IconButton onClick={() => addDevice(ri)} sx={{ color: "#fff" }}>
              <AddIcon /> Add Device
            </IconButton>
          </Box>
        ))}
        <Button variant="contained" onClick={addRoom} sx={{ mr: 2 }}>Add Room</Button>
        <Button variant="contained" onClick={handleSubmit}>Submit Building</Button>
      </Box>
    </Modal>
  );
}

export default AddBuildingModal;
