package harness

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// Status is the result of probing a Sentinel harness.
type Status struct {
	State   string `json:"state"` // disconnected | mismatched | matched
	BaseURL string `json:"baseUrl"`
	SREPath string `json:"srePath"`
	Project string `json:"project"`
	Message string `json:"message"`
}

type runtimeInfo struct {
	SREPath string `json:"sre_path"`
	CWD     string `json:"cwd"`
	Project string `json:"project"`
}

// Probe checks GET {base}/hl then GET {base}/hl/runtime.
func Probe(baseURL, localSRE string) Status {
	baseURL = strings.TrimRight(strings.TrimSpace(baseURL), "/")
	st := Status{State: "disconnected", BaseURL: baseURL, Message: "Harness not reachable"}
	if baseURL == "" {
		st.Message = "No harness URL configured"
		return st
	}

	client := &http.Client{Timeout: 1500 * time.Millisecond}
	resp, err := client.Get(baseURL + "/hl")
	if err != nil {
		st.Message = "Harness not reachable"
		return st
	}
	resp.Body.Close()
	if resp.StatusCode >= 500 {
		st.Message = fmt.Sprintf("Harness health returned %d", resp.StatusCode)
		return st
	}

	rtResp, err := client.Get(baseURL + "/hl/runtime")
	if err != nil {
		st.State = "mismatched"
		st.Message = "Health ok, runtime metadata unavailable"
		return st
	}
	defer rtResp.Body.Close()
	var rt runtimeInfo
	_ = json.NewDecoder(rtResp.Body).Decode(&rt)
	st.SREPath = rt.SREPath
	st.Project = rt.Project

	localAbs, _ := filepath.Abs(localSRE)
	if localAbs != "" {
		if resolved, err := filepath.EvalSymlinks(localAbs); err == nil {
			localAbs = resolved
		}
	}
	remoteAbs := rt.SREPath
	if remoteAbs != "" {
		if abs, err := filepath.Abs(remoteAbs); err == nil {
			remoteAbs = abs
		}
		if resolved, err := filepath.EvalSymlinks(remoteAbs); err == nil {
			remoteAbs = resolved
		}
	}

	if remoteAbs == "" {
		st.State = "mismatched"
		st.Message = "Harness did not report sre_path"
		return st
	}
	if samePath(localAbs, remoteAbs) {
		st.State = "matched"
		st.Message = "Harness is serving this SRE"
		return st
	}
	st.State = "mismatched"
	st.Message = "Harness is serving a different SRE"
	return st
}

func samePath(a, b string) bool {
	a = filepath.Clean(a)
	b = filepath.Clean(b)
	if a == b {
		return true
	}
	// Best-effort: compare after EvalSymlinks already applied.
	ai, err1 := os.Stat(a)
	bi, err2 := os.Stat(b)
	if err1 != nil || err2 != nil {
		return strings.EqualFold(a, b)
	}
	return os.SameFile(ai, bi)
}

// RenderURL builds GET /fcms/render/{ns}/{name}/{template}/{slug}.
func RenderURL(baseURL, ns, name, template, slug string) string {
	baseURL = strings.TrimRight(strings.TrimSpace(baseURL), "/")
	if template == "" {
		template = "render"
	}
	parts := []string{"fcms", "render", ns, name, template}
	for _, seg := range strings.Split(slug, "/") {
		if seg != "" {
			parts = append(parts, url.PathEscape(seg))
		}
	}
	return baseURL + "/" + strings.Join(parts, "/")
}
