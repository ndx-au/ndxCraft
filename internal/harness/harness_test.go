package harness

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"
)

func TestRenderURL(t *testing.T) {
	u := RenderURL("http://127.0.0.1:8080/", "sn", "cms", "render", "guides/getting-started")
	want := "http://127.0.0.1:8080/fcms/render/sn/cms/render/guides/getting-started"
	if u != want {
		t.Fatalf("got %s want %s", u, want)
	}
}

func TestProbeMatched(t *testing.T) {
	dir := t.TempDir()
	abs, _ := filepath.Abs(dir)
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/hl":
			w.Write([]byte(`{"status":"ok"}`))
		case "/hl/runtime":
			_ = json.NewEncoder(w).Encode(map[string]string{"sre_path": abs, "project": "demo"})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	st := Probe(srv.URL, dir)
	if st.State != "matched" {
		t.Fatalf("state=%s msg=%s", st.State, st.Message)
	}
}

func TestProbeDisconnected(t *testing.T) {
	st := Probe("http://127.0.0.1:1", "/tmp")
	if st.State != "disconnected" {
		t.Fatalf("%#v", st)
	}
}
