package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"

	"ndxCraft/internal/fcmsdoc"
	"ndxCraft/internal/gitstatus"
	"ndxCraft/internal/harness"
	"ndxCraft/internal/sre"
)

func (a *App) InspectSRE(root string) (*sre.Project, error) {
	return sre.Inspect(root)
}

func (a *App) SplitDocument(content string) fcmsdoc.Document {
	return fcmsdoc.Split(content)
}

func (a *App) AssembleDocument(frontMatter map[string]interface{}, body string, hadFrontMatter bool) (string, error) {
	return fcmsdoc.Assemble(frontMatter, body, hadFrontMatter)
}

func (a *App) ValidateSlug(slug string) error {
	return fcmsdoc.ValidateSlug(slug)
}

func (a *App) CreateArticle(kitPath, slug, title, description string, tags []string) (string, error) {
	return sre.CreateArticle(kitPath, slug, title, description, tags)
}

func (a *App) ProbeHarness(baseURL, sreRoot string) harness.Status {
	return harness.Probe(baseURL, sreRoot)
}

func (a *App) HarnessRenderURL(baseURL, ns, name, template, slug string) string {
	return harness.RenderURL(baseURL, ns, name, template, slug)
}

func (a *App) GitRepoStatus(root string) gitstatus.Status {
	return gitstatus.Inspect(root)
}

func (a *App) SearchContent(root, query string) ([]sre.SearchHit, error) {
	return sre.Search(root, query)
}

func (a *App) HasGeminiKey() bool {
	return os.Getenv("GEMINI_API_KEY") != ""
}

func (a *App) RevealInFileManager(path string) error {
	if path == "" {
		return fmt.Errorf("empty path")
	}
	info, err := os.Stat(path)
	if err != nil {
		return err
	}
	target := path
	if !info.IsDir() {
		target = filepath.Dir(path)
	}
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", target)
	case "windows":
		cmd = exec.Command("explorer", target)
	default:
		cmd = exec.Command("xdg-open", target)
	}
	return cmd.Start()
}

func (a *App) DuplicateFile(path string) (string, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	ext := filepath.Ext(path)
	base := strings.TrimSuffix(path, ext)
	dest := base + "-copy" + ext
	for i := 2; fileExists(dest); i++ {
		dest = fmt.Sprintf("%s-copy-%d%s", base, i, ext)
	}
	if err := os.WriteFile(dest, raw, 0644); err != nil {
		return "", err
	}
	return dest, nil
}

func (a *App) CreateFolder(path string) error {
	return os.MkdirAll(path, 0755)
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}
