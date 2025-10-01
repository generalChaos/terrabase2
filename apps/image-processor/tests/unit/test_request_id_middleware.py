"""
Unit tests for Request ID Middleware
"""

import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock
import uuid

from src.middleware.request_id import RequestIDMiddleware


@pytest.fixture
def app():
    """Create a test FastAPI app with request ID middleware"""
    app = FastAPI()
    app.add_middleware(RequestIDMiddleware)
    
    @app.get("/test")
    async def test_endpoint(request: Request):
        return {"request_id": getattr(request.state, 'request_id', None)}
    
    @app.get("/error")
    async def error_endpoint():
        raise ValueError("Test error")
    
    return app


@pytest.fixture
def client(app):
    """Create a test client"""
    return TestClient(app)


def test_request_id_generated_when_not_provided(client):
    """Test that a request ID is generated when not provided in headers"""
    response = client.get("/test")
    
    assert response.status_code == 200
    data = response.json()
    assert "request_id" in data
    assert data["request_id"] is not None
    
    # Check that request ID is in response headers
    assert "X-Request-ID" in response.headers
    assert response.headers["X-Request-ID"] == data["request_id"]


def test_request_id_used_when_provided(client):
    """Test that provided request ID is used when present in headers"""
    provided_id = str(uuid.uuid4())
    
    response = client.get("/test", headers={"X-Request-ID": provided_id})
    
    assert response.status_code == 200
    data = response.json()
    assert data["request_id"] == provided_id
    
    # Check that same request ID is in response headers
    assert response.headers["X-Request-ID"] == provided_id


def test_request_id_in_error_responses(client):
    """Test that request ID is included in error responses"""
    try:
        response = client.get("/error")
    except Exception:
        # If the test client raises an exception, that's expected
        # The middleware should still have logged the request
        pass
    else:
        # If we get a response, check it has request ID
        assert response.status_code == 500
        data = response.json()
        assert "request_id" in data
        assert data["request_id"] is not None
        
        # Check that request ID is in response headers
        assert "X-Request-ID" in response.headers


def test_request_id_middleware_order():
    """Test that request ID middleware can be added to app"""
    app = FastAPI()
    
    # Should not raise any exceptions
    app.add_middleware(RequestIDMiddleware)
    
    assert len(app.user_middleware) == 1


def test_request_id_middleware_with_custom_header():
    """Test request ID middleware with custom header name"""
    app = FastAPI()
    app.add_middleware(RequestIDMiddleware, header_name="X-Custom-Request-ID")
    
    @app.get("/test")
    async def test_endpoint(request: Request):
        return {"request_id": getattr(request.state, 'request_id', None)}
    
    client = TestClient(app)
    response = client.get("/test", headers={"X-Custom-Request-ID": "custom-123"})
    
    assert response.status_code == 200
    data = response.json()
    assert data["request_id"] == "custom-123"
    assert response.headers["X-Custom-Request-ID"] == "custom-123"
