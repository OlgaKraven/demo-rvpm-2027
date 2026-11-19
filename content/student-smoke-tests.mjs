export const studentSmokeTests=String.raw`"""Проверки своего запущенного портала без изменения записей базы."""
import os
from urllib.error import HTTPError
from urllib.parse import urlparse
from urllib.request import urlopen

BASE_URL = os.environ.get("PORTAL_TEST_URL", "http://127.0.0.1:5017").rstrip("/")


def open_page(path):
    try:
        response = urlopen(BASE_URL + path, timeout=10)
    except HTTPError as error:
        response = error
    with response:
        return response.status, response.geturl(), response.read().decode("utf-8")


def test_catalogue_uses_the_seeded_room():
    status, _, html = open_page("/rooms")
    assert status == 200
    assert "Балтика" in html
    assert "120" in html


def test_guest_dashboard_requires_login():
    status, address, _ = open_page("/dashboard")
    assert status == 200
    assert urlparse(address).path == "/login"


def test_guest_admin_requires_login():
    status, address, _ = open_page("/admin")
    assert status == 200
    assert urlparse(address).path == "/login"


def test_unknown_page_returns_404():
    status, _, _ = open_page("/page-that-does-not-exist")
    assert status == 404
`;
