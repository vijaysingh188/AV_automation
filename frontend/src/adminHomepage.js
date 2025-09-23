import React, { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableRow, Button, Modal, Box, TextField } from "@mui/material";
import AddBuildingModal from "./AddBuildingModal";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "#d32c2cff",
  color: "#fff",
  boxShadow: 24,
  p: 4,
  borderRadius: "12px",
  minWidth: 400
};

function Homepage() {
  const [buildings, setBuildings] = useState([]);
  const [openForm, setOpenForm] = useState(false);

  const fetchBuildings = () => {
    fetch("http://127.0.0.1:8000/homeadmin")
      .then(res => res.json())
      .then(data => setBuildings(data.buildings || []))
      .catch(() => setBuildings([])); // fallback empty array
  };

  useEffect(() => { fetchBuildings(); }, []);

  return (
    <div style={{ background: "#cfb3b3ff", color: "#fff", minHeight: "100vh", padding: "2rem" }}>
      <h1>Admin Homepage</h1>
      <Button variant="contained" onClick={() => setOpenForm(true)} sx={{ mb: 2 }}>Add New Building</Button>

      <AddBuildingModal
        open={openForm}
        handleClose={() => setOpenForm(false)}
        refreshBuildings={fetchBuildings}
      />

      {/* Buildings Table */}
      {buildings.length === 0 ? (
        <p>No buildings available.</p>
      ) : (
        buildings.map((b, i) => (
          <div key={i} style={{ marginBottom: "2rem" }}>
            <h2>{b.building_name || "Unnamed Building"}</h2>

            {b.rooms?.length === 0 ? (
              <p>No rooms available.</p>
            ) : (
              b.rooms.map((r, j) => (
                <div key={j} style={{ marginBottom: "1rem" }}>
                  <h3>{r.room_name || "Unnamed Room"}</h3>
                  {r.devices?.length === 0 ? (
                    <p>No devices available.</p>
                  ) : (
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Device Name</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell>IP Address</TableCell>
                          <TableCell>Driver</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {r.devices.map((d, k) => (
                          <TableRow key={k}>
                            <TableCell>{d.device_name || "-"}</TableCell>
                            <TableCell>{d.device_category || "-"}</TableCell>
                            <TableCell>{d.ip_address || "-"}</TableCell>
                            <TableCell>{d.device_driver || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              ))
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default Homepage;
