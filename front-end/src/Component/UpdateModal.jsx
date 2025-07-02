import React ,{useState} from 'react';
import {Modal, Button, Form, } from 'react-bootstrap';

//Function Definition:
function UpdateModal({show, onHide}){
    //State Management:
   const [SearchPLOID, setSearchPLOID] = useState('');
   const [SearchPLONAME_TH, setSearchPLONAME_TH] = useState('');
   
   //Form Validation:
   //const correctFrom = PLOID.trim() !== '' && PLONAME_TH.trim() !== ''; 

   //State for update filds
   const [PLOID, setPLOID] = useState('');
   const [PLONAME_TH, setPLONAME_TH] = useState('');
   const [PLONAME_ENG, setPLONAME_ENG] = useState('');
   const [PLO_DATA, setPLO_DATA] = useState('');
   const [error, setError] = useState(null);
 
   //Search Handler:
const handleSearch = async () => {
  try {
    const url = `/search?PLOID=${SearchPLOID}&PLONAME_TH=${SearchPLONAME_TH}`;
    const response = await axios.get(url);

    const data = response.data;

    const fetchedData = Array.isArray(data) && data.length > 0 ? data[0] : {};

    setPLOID(fetchedData.PLOID || '');
    setPLONAME_TH(fetchedData.PLONAME_TH || '');
    setPLONAME_ENG(fetchedData.PLONAME_ENG || '');
    setPLO_DATA(fetchedData.PLO_DATA || '');
    setError(null);
  } catch (error) {
    console.error('Error performing search', error);
    setError('Failed to perform search');
  }
};

const handleUpdate = async () => {
  try {
    const url = `/update?PLOID=${SearchPLOID}&PLONAME_TH=${SearchPLONAME_TH}`;
    const data = {
      PLOID,
      PLONAME_TH,
      PLONAME_ENG,
      PLO_DATA,
    };

    const response = await axios.put(url, data, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 200) {
      window.location.reload();
      onHide();
    } else {
      throw new Error('Update failed');
    }
  } catch (error) {
    console.error('Error performing update', error);
    alert(error.response?.data || error.message || 'Update failed');
  }
};
    //Modal Component:

    return(
        <Modal show={show} onHide={onHide}>
        <Modal.Header closeButton>
            <Modal.Title>Update Data</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <Form>
                <Form.Group>
                    <Form.Label>PLOID</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Enter PLOID"
                        value={SearchPLOID}
                        onChange={(e) => setSearchPLOID(e.target.value)}
                        
                    />
                </Form.Group>
                <Form.Group>
                    <Form.Label>Search PLONAME_TH</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Enter PLONAME THAI"
                        value={SearchPLONAME_TH}
                        onChange={(e) => setSearchPLONAME_TH(e.target.value)}
                    />
                </Form.Group>
                <Button variant="primary" onClick={handleSearch}>Search</Button>

                <hr/>
                <Form.Group>
            <Form.Label>PLONAME_ENG</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter PLONAME ENG"
              value={PLONAME_ENG}
              onChange={(e) => setPLONAME_ENG(e.target.value)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label> PLODATA</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter PLODATA"
              value={PLO_DATA}
              onChange={(e) => setPLO_DATA(e.target.value)}
            />
            </Form.Group>
            </Form>
        </Modal.Body>
        <Modal.Footer>
            <Button variant='secondary' onClick={onHide}>Close</Button>
            <Button variant='primary' onClick={handleUpdate} >Update</Button>
        </Modal.Footer>
        </Modal>
    );
}
export default UpdateModal;