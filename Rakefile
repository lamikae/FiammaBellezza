#!/usr/bin/env ruby
require 'rake'
require 'fileutils'
require 'coffee_script'

builddir = "build"

task :default => :build

task :clean do
  if File.directory? builddir
    FileUtils.rm_r builddir
  end
  FileUtils.mkdir builddir
end

task :build => :clean do
  FileUtils.cp "README", builddir
  FileUtils.cp "Rakefile", builddir
  FileUtils.cp "index.html", builddir
  FileUtils.cp_r 'src', builddir
  FileUtils.cp_r 'css', builddir
  FileUtils.cp_r 'audio', builddir

  # js libs
  FileUtils.cp_r 'js', builddir

  # compile main JS
  File.open("#{builddir}/js/fiamma.js","w") do |file|
    file.write CoffeeScript.compile(File.read("src/fiamma.js.coffee"), {})
  end
end

task :zip => :build do
  Dir.chdir builddir
  zipfile = "fiamma-bellezza_demo_package.zip"
  system "zip -r #{zipfile} ."
  system "unzip -l #{zipfile}"
end

