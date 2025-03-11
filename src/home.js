import React from 'react';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const tools = [
    { name: 'Supplier File Converter QAT', description: 'Converts Supplier Excel Files to STEP-XML (OPIL)', page: '/STEPXMLGenerator' }
    // Add more tools as needed

    // Add more tools as needed
  ];

  const navigate = useNavigate();

  return (
    <Container style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' }}>
      <p style={{ fontSize: '1.5em', textAlign: 'center', marginBottom: '2em', marginTop: '2em' }}>

      </p>
      <Container style={{ padding: '1em' }}>
        <Row >
          {tools.map((tool, index) => (
            <Col className="d-flex flex-column" style={{ marginBottom: '2em' }} key={index}>
              <Card className="d-flex flex-column " style={{ maxWidth: '18rem', padding: '1em', boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)', transition: '0.3s', borderRadius: '5px' }}>

                <Card.Body className="d-flex flex-column">
                  <Card.Title>{tool.name}</Card.Title>
                  <Card.Text>{tool.description}</Card.Text>
                  <Button variant="primary" style={{ width: '100px', alignSelf: 'center' }} className="mt-auto" onClick={() => navigate(tool.page)}>Go</Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </Container>
  );
}

export default HomePage;
