package fcmsdoc

import (
	"os"
	"strings"
	"testing"
)

func TestSplitNoFrontMatter(t *testing.T) {
	src := "# Hello\n\nBody.\n"
	doc := Split(src)
	if doc.HasFrontMatter {
		t.Fatal("expected no frontmatter")
	}
	if doc.Body != src {
		t.Fatalf("body mismatch: %q", doc.Body)
	}
	if len(doc.Warnings) == 0 {
		t.Fatal("expected title warning")
	}
}

func TestSplitAndAssembleRoundTrip(t *testing.T) {
	src := `---
title: Hello World
date: "2026-03-01"
description: First post
tags:
    - intro
    - blog
agent_context:
    tone: friendly
custom_field: extra
---

# Hello World

Preamble before the first section.

## Overview

Addressable section.
`
	doc := Split(src)
	if !doc.HasFrontMatter {
		t.Fatal("expected frontmatter")
	}
	if doc.FrontMatter["title"] != "Hello World" {
		t.Fatalf("title: %#v", doc.FrontMatter["title"])
	}
	if !strings.HasPrefix(doc.Body, "# Hello World") {
		t.Fatalf("body: %q", doc.Body)
	}
	out, err := Assemble(doc.FrontMatter, doc.Body, true)
	if err != nil {
		t.Fatal(err)
	}
	again := Split(out)
	if again.FrontMatter["title"] != "Hello World" {
		t.Fatalf("round-trip title: %#v", again.FrontMatter["title"])
	}
	if again.FrontMatter["custom_field"] != "extra" {
		t.Fatalf("meta lost: %#v", again.FrontMatter["custom_field"])
	}
	if !strings.Contains(again.Body, "## Overview") {
		t.Fatalf("section lost: %q", again.Body)
	}
}

func TestAssembleOmitsEmptyFrontMatter(t *testing.T) {
	body := "# Title\n\nHi.\n"
	out, err := Assemble(map[string]interface{}{}, body, false)
	if err != nil {
		t.Fatal(err)
	}
	if strings.HasPrefix(out, "---") {
		t.Fatalf("should not wrap: %q", out)
	}
}

func TestAssembleAddsFrontMatterWhenFilled(t *testing.T) {
	out, err := Assemble(map[string]interface{}{"title": "Guide"}, "# Body\n", false)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.HasPrefix(out, "---\n") {
		t.Fatalf("expected yaml block: %q", out)
	}
	if !strings.Contains(out, "title: Guide") {
		t.Fatalf("missing title: %q", out)
	}
}

func TestKeyOrderStable(t *testing.T) {
	fm := map[string]interface{}{
		"zebra":       "last",
		"title":       "T",
		"description": "D",
		"date":        "2026-01-01",
		"slug":        "hello",
		"tags":        []string{"a"},
	}
	out, err := Assemble(fm, "body\n", true)
	if err != nil {
		t.Fatal(err)
	}
	idx := func(s string) int { return strings.Index(out, s) }
	order := []string{"title:", "slug:", "date:", "description:", "tags:", "zebra:"}
	for i := 1; i < len(order); i++ {
		if idx(order[i-1]) < 0 || idx(order[i]) < 0 {
			t.Fatalf("missing keys in %q", out)
		}
		if idx(order[i-1]) > idx(order[i]) {
			t.Fatalf("order broken around %s in %q", order[i], out)
		}
	}
}

func TestValidateSlug(t *testing.T) {
	ok := []string{"hello-world", "guides/getting-started", "a", "0start"}
	for _, s := range ok {
		if err := ValidateSlug(s); err != nil {
			t.Errorf("%s: %v", s, err)
		}
	}
	bad := []string{"", "../x", "/abs", "_hidden", "Hello", "has space", "dot.dot"}
	for _, s := range bad {
		if err := ValidateSlug(s); err == nil {
			t.Errorf("%s: expected error", s)
		}
	}
}

func TestGoldenFixtureStable(t *testing.T) {
	raw, err := os.ReadFile("testdata/hello-world.md")
	if err != nil {
		t.Fatal(err)
	}
	doc := Split(string(raw))
	out1, err := Assemble(doc.FrontMatter, doc.Body, true)
	if err != nil {
		t.Fatal(err)
	}
	doc2 := Split(out1)
	out2, err := Assemble(doc2.FrontMatter, doc2.Body, true)
	if err != nil {
		t.Fatal(err)
	}
	if out1 != out2 {
		t.Fatalf("unstable assemble\n---1---\n%s\n---2---\n%s", out1, out2)
	}
	if doc2.FrontMatter["title"] != "Hello World" {
		t.Fatal(doc2.FrontMatter["title"])
	}
	if !strings.Contains(doc2.Body, "## Overview") {
		t.Fatal(doc2.Body)
	}
}

func TestDateWarning(t *testing.T) {
	w := ValidateFrontMatter(map[string]interface{}{"title": "T", "date": "not-a-date"})
	found := false
	for _, x := range w {
		if x.Field == "date" {
			found = true
		}
	}
	if !found {
		t.Fatalf("expected date warning: %#v", w)
	}
}
