import Stack from "@mui/material/Stack";
import React, { useEffect, useState, useRef, useCallback } from "react";
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
  const [openOptionsList, setOpenOptionsList] = useState([]); // {id, device, position}

  // base API url from .env (REACT_APP_API_URL) or fallback
  const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

  // simple IPv4 validator used in add/edit device forms
  const ipRegex = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;

  // load/refresh buildings list from backend
  const refreshData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/homeadmin`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setBuildings(data.buildings || []);
    } catch (err) {
      console.error("refreshData error:", err);
    }
  }, [API_BASE]);

  // initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // ref to track current drag operation
  const dragRef = useRef({
    draggingId: null,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0
  });

  // helper to start a drag
  const startDrag = (id, e) => {
    e.preventDefault();
    const isTouch = e.type === "touchstart";
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    setOpenOptionsList(prev => {
      const entry = prev.find(x => x.id === id);
      if (!entry) return prev;
      dragRef.current = {
        draggingId: id,
        startX: clientX,
        startY: clientY,
        origX: entry.position.x,
        origY: entry.position.y
      };
      return prev;
    });

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", endDrag);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", endDrag);
  };

  const onMove = e => {
    if (!dragRef.current.draggingId) return;
    e.preventDefault();
    const isTouch = e.type === "touchmove";
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;

    setOpenOptionsList(prev =>
      prev.map(entry =>
        entry.id === dragRef.current.draggingId
          ? { ...entry, position: { x: dragRef.current.origX + dx, y: dragRef.current.origY + dy } }
          : entry
      )
    );
  };

  const endDrag = () => {
    dragRef.current.draggingId = null;
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", endDrag);
    document.removeEventListener("touchmove", onMove);
    document.removeEventListener("touchend", endDrag);
  };

  const handleOptionsOpen = async device => {
    const res = await fetch(`${API_BASE}/device/functions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_driver: device.device_driver })
    });
    const data = await res.json();

    setOpenOptionsList(prev => {
      const idx = prev.length;
      // base position: center offset by count so they don't stack exactly
      const startX = Math.max(20, window.innerWidth / 2 + idx * 20 - 200);
      const startY = Math.max(20, window.innerHeight / 2 + idx * 20 - 120);
      const entry = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        device: { ...device, functionalities: data.functions || [] },
        position: { x: startX, y: startY }
      };
      return [...prev, entry];
    });
  };

  const handleOptionsClose = id => {
    setOpenOptionsList(prev => prev.filter(e => e.id !== id));
  };

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
      
      const response = await fetch(`${API_BASE}/device/edit`, {
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
        `${API_BASE}/device/delete?building_id=${buildingId}&room_name=${roomName}&device_brand=${deviceName}`,
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
    await fetch(`${API_BASE}/device/add`, {
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
    await fetch(`${API_BASE}/add-building`, {
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
    await fetch(`${API_BASE}/add-room`, {
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

  // helper to prevent backdrop/escape closing - only close on explicit calls
  const preventClose = setter => (event, reason) => {
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
    setter(false);
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
      <Modal
        open={openAddBuilding}
        onClose={preventClose(setOpenAddBuilding)}
        disableAutoFocus
        disableEnforceFocus
        disableRestoreFocus
        BackdropProps={{ invisible: true }}
      >
        <Box sx={{ ...modalStyle, zIndex: 1400 }}>
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
            <Button
              onClick={() => setOpenAddBuilding(false)}
              variant="outlined"
              color="secondary"
              sx={{ mt: 2, ml: 2 }}
            >
              Close
            </Button>
          </form>
        </Box>
      </Modal>

      {/* Add Room Modal */}
      <Modal
        open={openAddRoom}
        onClose={preventClose(setOpenAddRoom)}
        disableAutoFocus
        disableEnforceFocus
        disableRestoreFocus
        BackdropProps={{ invisible: true }}
      >
        <Box sx={{ ...modalStyle, zIndex: 1410 }}>
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
            <Button
              onClick={() => setOpenAddRoom(false)}
              variant="outlined"
              color="secondary"
              sx={{ mt: 2, ml: 2 }}
            >
              Close
            </Button>
          </form>
        </Box>
      </Modal>

      {/* Add Device Modal */}
      <Modal
        open={openAdd}
        onClose={preventClose(setOpenAdd)}
        disableAutoFocus
        disableEnforceFocus
        disableRestoreFocus
        BackdropProps={{ invisible: true }}
      >
        <Box sx={{ ...modalStyle, zIndex: 1420 }}>
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
                  {option.split(/[\\/]/).pop().replace(/\.py$/, "")}
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

      {/* Options Modals - render one Modal per open entry */}
      {openOptionsList.map((entry, idx) => (
        <Modal
          key={entry.id}
          open={true}
          onClose={(event, reason) => {
            if (reason === "backdropClick" || reason === "escapeKeyDown") return;
            handleOptionsClose(entry.id);
          }}
          hideBackdrop
          disableAutoFocus
          disableEnforceFocus
          disableRestoreFocus
          BackdropProps={{ sx: { pointerEvents: "none" } }}
          style={{ pointerEvents: "none" }}
        >
          {/* make modal positioned by entry.position and draggable via handlers */}
          <Box
            onMouseDown={e => {
              // allow dragging only when clicking the header area - guard by class
              if (e.target.closest && e.target.closest(".drag-handle")) startDrag(entry.id, e);
            }}
            onTouchStart={e => {
              if (e.target.closest && e.target.closest(".drag-handle")) startDrag(entry.id, e);
            }}
            sx={{
              ...modalStyle,
              minWidth: 350,
              maxWidth: 400,
              zIndex: 1430 + idx,
              pointerEvents: "auto",
              // use fixed positioning with explicit coordinates from state
              position: "fixed",
              left: `${entry.position?.x ?? 100}px`,
              top: `${entry.position?.y ?? 100}px`,
              transform: "none"
            }}
          >
            <Typography
              className="drag-handle"
              variant="h5"
              align="center"
              gutterBottom
              sx={{ fontWeight: 600, cursor: "move", userSelect: "none" }}
            >
              {entry.device?.device_brand} - Actions
            </Typography>
            <Stack spacing={2} sx={{ mb: 2 }}>
              {entry.device?.functionalities?.map((f, i) => (
                <Button
                  key={i}
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
                    const body = {
                      device_driver: entry.device.device_driver,
                      ip: entry.device.ip_address,
                      action: f
                    };
                    const res = await fetch(`${API_BASE}/device/do-action`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(body)
                    });
                    const data = await res.json();
                    console.log(data);
                  }}
                >
                  {f}
                </Button>
              ))}
            </Stack>
            <Button
              onClick={() => handleOptionsClose(entry.id)}
              variant="outlined"
              color="secondary"
              fullWidth
              sx={{ mt: 1, borderRadius: 2, fontWeight: 500 }}
            >
              Close
            </Button>
          </Box>
        </Modal>
      ))}

      {/* Edit Modal */}
      <Modal
        open={openEdit}
        onClose={preventClose(setOpenEdit)}
        disableAutoFocus
        disableEnforceFocus
        disableRestoreFocus
        BackdropProps={{ invisible: true }}
      >
        <Box sx={{ ...modalStyle, zIndex: 1440 }}>
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
                {option.split(/[\\/]/).pop().replace(/\.py$/, "")}
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