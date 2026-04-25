package com.capstone.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "app_user")
public class UserAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "license_number")
    private String licenseNumber;

    @Column(name = "hospital")
    private String hospital;

    @Column(name = "department")
    private String department;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public UserAccount() {
    }

    public UserAccount(
        String email,
        String passwordHash,
        String licenseNumber,
        String hospital,
        String department,
        String status
    ) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.licenseNumber = licenseNumber;
        this.hospital = hospital;
        this.department = department;
        this.status = status;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getLicenseNumber() {
        return licenseNumber;
    }

    public String getHospital() {
        return hospital;
    }

    public String getDepartment() {
        return department;
    }

    public String getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
