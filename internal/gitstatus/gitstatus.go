package gitstatus

import (
	"os/exec"
	"strings"
)

// Status is a lightweight git porcelain snapshot.
type Status struct {
	Branch string            `json:"branch"`
	Dirty  int               `json:"dirty"`
	Files  map[string]string `json:"files"`
}

// Inspect runs git status in root.
func Inspect(root string) Status {
	st := Status{Files: map[string]string{}, Branch: ""}
	if root == "" {
		return st
	}
	branchOut, err := exec.Command("git", "-C", root, "rev-parse", "--abbrev-ref", "HEAD").Output()
	if err != nil {
		return st
	}
	st.Branch = strings.TrimSpace(string(branchOut))

	porc, err := exec.Command("git", "-C", root, "status", "--porcelain", "-uall").Output()
	if err != nil {
		return st
	}
	for _, line := range strings.Split(string(porc), "\n") {
		if len(line) < 4 {
			continue
		}
		code := strings.TrimSpace(line[:2])
		path := strings.TrimSpace(line[3:])
		if i := strings.Index(path, " -> "); i >= 0 {
			path = path[i+4:]
		}
		path = strings.Trim(path, `"`)
		st.Files[path] = code
		st.Dirty++
	}
	return st
}
