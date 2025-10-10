import Stack from "@mui/material/Stack";
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
  TextField,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  MenuItem,
  Typography
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddBusinessIcon from "@mui/icons-material/AddBusiness";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import DevicesIcon from "@mui/icons-material/Devices";
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
  const [openAddBuilding, setOpenAddBuilding] = useState(false);
  const [openAddRoom, setOpenAddRoom] = useState(false);
  const [addRoom, setAddRoom] = useState({ buildingId: "", roomName: "" });
  const [addRoomBuildingId, setAddRoomBuildingId] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [newBuildingName, setNewBuildingName] = useState("");
  const [currentDevice, setCurrentDevice] = useState(null);
  const [editForm, setEditForm] = useState({
    ip_address: "",
    device_category: "",
    device_driver: "",
    device_brand: ""
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

  const ipRegex =
    /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;

  const handleOptionsOpen = async device => {
    const res = await fetch("http://localhost:8000/device/functions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_driver: device.device_driver })
    });
    const data = await res.json();
    setCurrentDevice({ ...device, functionalities: data.functions || [] });
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
    if (!ipRegex.test(editForm.ip_address)) {
      alert("Please enter a valid IPv4 address.");
      return;
    }
    try {
      const response = await fetch("http://127.0.0.1:8000/device/edit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          building_id: currentDevice.building_id,
          room_number: currentDevice.room_number,
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

  const filteredDriverOptions = driverOptions.filter(option =>
    option.toLowerCase().includes(newDevice.device_brand?.toLowerCase() || "")
  );

  const handleDelete = async (buildingId, roomName, deviceName) => {
    if (!window.confirm(`Delete ${deviceName}?`)) return;
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/device/delete?building_id=${buildingId}&room_name=${roomName}&device_brand=${deviceName}`,
        { method: "DELETE" }
      );
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

  // Add Building
  const handleAddBuilding = async e => {
    e.preventDefault();
    if (!newBuildingName.trim()) {
      alert("Building name required");
      return;
    }
    await fetch("http://localhost:8000/add-building", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ building_name: newBuildingName })
    });
    setNewBuildingName("");
    setOpenAddBuilding(false);
    refreshData();
  };

  // Add Room
  const handleAddRoom = async e => {
    e.preventDefault();
    if (!newRoomName.trim()) {
      alert("Room name required");
      return;
    }
    await fetch("http://localhost:8000/add-room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        building_id: addRoomBuildingId,
        room_number: newRoomName
      })
    });
    setNewRoomName("");
    setOpenAddRoom(false);
    refreshData();
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e3f2fd 0%, #fce4ec 100%)",
        p: { xs: 2, md: 6 }
      }}
    >
      <Typography
        variant="h3"
        align="center"
        sx={{ fontWeight: 700, mb: 4, color: "#1976d2" }}
      >
        Admin Homepage
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddBusinessIcon />}
          onClick={() => setOpenAddBuilding(true)}
          sx={{
            px: 4,
            py: 1.5,
            fontWeight: 600,
            borderRadius: 3,
            boxShadow: 2,
            background: "linear-gradient(90deg, #1976d2 60%, #42a5f5 100%)"
          }}
        >
          Add Building
        </Button>
      </Box>
      <Grid container spacing={4}>
        {buildings.map(
          (b, i) =>
            b.building_name && (
              <Grid item xs={12} md={6} lg={4} key={i}>
                <Card
                  sx={{
                    borderRadius: 4,
                    boxShadow: 4,
                    background:
                      "linear-gradient(120deg, #fff 70%, #e3f2fd 100%)"
                  }}
                >
                  <CardHeader
                    avatar={<AddBusinessIcon color="primary" />}
                    title={
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, color: "#1976d2" }}
                      >
                        {b.building_name}
                      </Typography>
                    }
                    action={
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<MeetingRoomIcon />}
                        onClick={() => {
                          setAddRoomBuildingId(b._id);
                          setOpenAddRoom(true);
                        }}
                        sx={{ borderRadius: 2, fontWeight: 500 }}
                      >
                        Add Room
                      </Button>
                    }
                  />
                  <Divider />
                  <CardContent>
                    {b.rooms.length === 0 && (
                      <Typography
                        color="text.secondary"
                        align="center"
                        sx={{ my: 2 }}
                      >
                        No rooms added yet.
                      </Typography>
                    )}
                    {b.rooms.map((r, j) => (
                      <Box
                        key={j}
                        sx={{
                          mb: 3,
                          p: 2,
                          borderRadius: 3,
                          background: "#f5faff",
                          boxShadow: 1
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: "#1976d2",
                            mb: 1,
                            display: "flex",
                            alignItems: "center"
                          }}
                        >
                          <MeetingRoomIcon sx={{ mr: 1 }} />
                          {r.room_number}
                          <IconButton
                            color="primary"
                            size="small"
                            title="Add Device"
                            aria-label="Add Device"
                            onClick={() => {
                              setAddRoom({
                                buildingId: b._id,
                                roomName: r.room_number
                              });
                              setOpenAdd(true);
                            }}
                            sx={{
                              ml: 1,
                              bgcolor: "#e3f2fd",
                              "&:hover": { bgcolor: "#bbdefb" },
                              borderRadius: 2
                            }}
                          >
                            <DevicesIcon />
                          </IconButton>
                        </Typography>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>
                                Device Name
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>
                                Category
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>
                                IP Address
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>
                                Driver
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>
                                Actions
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {r.devices.length > 0 ? (
                              r.devices.map((d, k) => (
                                <TableRow key={k} hover>
                                  <TableCell>{d.device_brand}</TableCell>
                                  <TableCell>{d.device_category}</TableCell>
                                  <TableCell>{d.ip_address}</TableCell>
                                  <TableCell>
                                    {d.device_driver
                                      ? d.device_driver
                                          .split(/[\\/]/)
                                          .pop()
                                          .replace(/\.py$/, "")
                                      : ""}
                                  </TableCell>
                                  <TableCell>
                                    <IconButton
                                      color="primary"
                                      onClick={() =>
                                        handleEditOpen(
                                          d,
                                          b._id,
                                          r.room_number
                                        )
                                      }
                                    >
                                      <EditIcon />
                                    </IconButton>
                                    <IconButton
                                      color="error"
                                      onClick={() =>
                                        handleDelete(
                                          b._id,
                                          r.room_number,
                                          d.device_brand
                                        )
                                      }
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                    <Button
                                      variant="contained"
                                      size="small"
                                      sx={{
                                        ml: 1,
                                        borderRadius: 2,
                                        fontWeight: 500,
                                        background:
                                          "linear-gradient(90deg, #1976d2 60%, #42a5f5 100%)"
                                      }}
                                      onClick={() => handleOptionsOpen(d)}
                                    >
                                      Controls
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell
                                  colSpan={5}
                                  align="center"
                                  sx={{ color: "#aaa" }}
                                >
                                  No devices available.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            )
        )}
      </Grid>
      {/* Add Building Modal */}
      <Modal open={openAddBuilding} onClose={() => setOpenAddBuilding(false)}>
        <Box sx={modalStyle}>
          <h2>Add Building</h2>
          <form onSubmit={handleAddBuilding}>
            <label htmlFor="buildingName">Building Name</label>
            <TextField
              id="buildingName"
              value={newBuildingName}
              onChange={e => setNewBuildingName(e.target.value)}
              required
              fullWidth
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
            >
              Add
            </Button>
          </form>
        </Box>
      </Modal>
      {/* Add Room Modal */}
      <Modal open={openAddRoom} onClose={() => setOpenAddRoom(false)}>
        <Box sx={modalStyle}>
          <h2>Add Room</h2>
          <form onSubmit={handleAddRoom}>
            <TextField
              label="Room Number"
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
              required
              fullWidth
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
            >
              Add
            </Button>
          </form>
        </Box>
      </Modal>
      {/* Add Device Modal */}
      <Modal open={openAdd} onClose={() => setOpenAdd(false)}>
        <Box sx={modalStyle}>
          <h2>Add Device</h2>
          <form
            onSubmit={async e => {
              e.preventDefault();
              if (!ipRegex.test(newDevice.ip_address)) {
                alert("Please enter a valid IPv4 address.");
                return;
              }
              try {
                await addDevice(
                  addRoom.buildingId,
                  addRoom.roomName,
                  newDevice
                );
                alert("Device added!");
                setNewDevice({
                  ip_address: "",
                  device_brand: "",
                  device_category: "",
                  device_driver: "",
                  functionalities: []
                });
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
              onChange={e =>
                setNewDevice({ ...newDevice, ip_address: e.target.value })
              }
              required
            />
            <TextField
              label="Brand"
              select
              value={newDevice.device_brand}
              onChange={e =>
                setNewDevice({ ...newDevice, device_brand: e.target.value })
              }
              required
            >
              {brandOptions.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Category"
              select
              value={newDevice.device_category}
              onChange={e =>
                setNewDevice({ ...newDevice, device_category: e.target.value })
              }
              required
            >
              {categoryOptions.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Driver"
              select
              value={newDevice.device_driver}
              onChange={e =>
                setNewDevice({ ...newDevice, device_driver: e.target.value })
              }
              required
            >
              {filteredDriverOptions.map(option => (
                <MenuItem key={option} value={option}>
                  {option.split(/[\\/]/).pop().replace(/\.js$/, "")}
                </MenuItem>
              ))}
            </TextField>
            <Button type="submit" variant="contained" color="primary">
              Add Device
            </Button>
            <Button
              onClick={() => setOpenAdd(false)}
              variant="outlined"
              color="secondary"
            >
              Cancel
            </Button>
          </form>
        </Box>
      </Modal>
      {/* Options Modal */}
      <Modal open={openOptions} onClose={handleOptionsClose}>
        <Box sx={{ ...modalStyle, minWidth: 350, maxWidth: 400 }}>
          <Typography
            variant="h5"
            align="center"
            gutterBottom
            sx={{ fontWeight: 600 }}
          >
            {currentDevice?.device_brand} - Actions
          </Typography>
          <Stack spacing={2} sx={{ mb: 2 }}>
            {currentDevice?.functionalities?.map((f, idx) => (
              <Button
                key={idx}
                fullWidth
                variant="contained"
                color="primary"
                sx={{
                  textTransform: "none",
                  fontWeight: 500,
                  borderRadius: 2,
                  boxShadow: 1,
                  py: 1.2,
                  background: "linear-gradient(90deg, #1976d2 60%, #42a5f5 100%)"
                }}
                onClick={async () => {
                  // Prepare the body data for the new dynamic endpoint
                  const body = {
                    device_driver: currentDevice.device_driver, // JS file path
                    ip: currentDevice.ip_address,
                    action: f // e.g., "Power On"
                  };
                  console.log(body, '=============body'); // Log the body before sending

                  // Call backend API for dynamic device action
                  const res = await fetch("http://127.0.0.1:8000/device/do-action", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                  });
                  const data = await res.json();
                  console.log(data, '============data.message'); // This prints to browser console
                  // alert(data.message); // This shows a popup
                }}
              >
                {f}
              </Button>
            ))}
          </Stack>
          <Button
            onClick={handleOptionsClose}
            variant="outlined"
            color="secondary"
            fullWidth
            sx={{ mt: 1, borderRadius: 2, fontWeight: 500 }}
          >
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
            onChange={e =>
              setEditForm({ ...editForm, ip_address: e.target.value })
            }
          />
          <TextField
            label="Brand"
            select
            fullWidth
            margin="normal"
            value={editForm.device_brand}
            onChange={e =>
              setEditForm({ ...editForm, device_brand: e.target.value })
            }
            required
          >
            {brandOptions.map(option => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Category"
            select
            fullWidth
            margin="normal"
            value={editForm.device_category}
            onChange={e =>
              setEditForm({ ...editForm, device_category: e.target.value })
            }
            required
          >
            {categoryOptions.map(option => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Driver"
            select
            fullWidth
            margin="normal"
            value={editForm.device_driver}
            onChange={e =>
              setEditForm({ ...editForm, device_driver: e.target.value })
            }
            required
          >
            {driverOptions.map(option => (
              <MenuItem key={option} value={option}>
                {option.split(/[\\/]/).pop().replace(/\.js$/, "")}
              </MenuItem>
            ))}
          </TextField>
          <Button
            onClick={handleEditSave}
            variant="contained"
            color="primary"
            style={{ marginTop: "1rem" }}
          >
            Save
          </Button>
          <Button
            onClick={handleEditClose}
            variant="outlined"
            color="secondary"
            style={{ marginTop: "1rem", marginLeft: "1rem" }}
          >
            Cancel
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}

export default Homepage;