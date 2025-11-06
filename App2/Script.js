document.addEventListener("DOMContentLoaded", () => {
  // === CÁC HÀM XỬ LÝ GIAO DIỆN PHỤ (GIỮ NGUYÊN) ===
  function setupSmoothScroll() {
    document.addEventListener("click", function (e) {
      const link = e.target.closest('a[href^="#"]');
      if (!link || link.getAttribute("href") === "#") return;
      const targetElement = document.querySelector(link.getAttribute("href"));
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  function setupScrollSpy() {
    const mainNav = document.body;
    if (mainNav) {
      new bootstrap.ScrollSpy(mainNav, { target: "#collapsibleNavbar" });
    }
  }

  let allMembersData = [];
  let teamSectionLoaded = false; // Biến cờ để đảm bảo chỉ tải 1 lần

  // === CÁC HÀM LÀM VIỆC VỚI FIREBASE VÀ MODAL (GIỮ NGUYÊN) ===
  async function fetchTeamMembers() {
    try {
      const snapshot = await db.collection("member").get();
      const members = [];
      snapshot.forEach((doc) => {
        members.push({ id: doc.id, ...doc.data() });
      });
      console.log("Lấy dữ liệu thành công:", members);
      return members;
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu từ Firestore: ", error);
      return [];
    }
  }

  function populateSwiper(members) {
    const swiperWrapper = document.querySelector(
      ".team-swiper .swiper-wrapper"
    );
    if (!swiperWrapper) return;
    swiperWrapper.innerHTML = "";
    members.forEach((member) => {
      const rolesHTML = Array.isArray(member.roles)
        ? member.roles.join("<br>")
        : member.roles || "";
      const slideHTML = `
        <div class="swiper-slide">
          <div class="team-card">
            <div class="avatar-container">
              <img src="${member.avatar}" alt="${member.name}" />
              ${
                member.status === "online"
                  ? '<div class="status-indicator"></div>'
                  : ""
              }
            </div>
            <h4 class="member-name">${member.name}</h4>
            <div class="member-roles">${rolesHTML}</div>
            <div class="member-stats">
              <div class="stat-item">
                <span class="stat-number">${member.stats.projects}</span>
                <span class="stat-label">Projects</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">${member.stats.experience}</span>
                <span class="stat-label">Years</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">${member.stats.clients}</span>
                <span class="stat-label">Clients</span>
              </div>
            </div>
            <button class="btn btn-profile" data-bs-toggle="modal" data-bs-target="#profileModal" data-member-id="${
              member.id
            }">
              Xem Profile
            </button>
          </div>
        </div>`;
      swiperWrapper.insertAdjacentHTML("beforeend", slideHTML);
    });
  }

  function displayMemberProfile(memberId) {
    const member = allMembersData.find((m) => m.id === memberId);
    if (!member) {
      console.error("Không tìm thấy thành viên với ID:", memberId);
      return;
    }
    const modalBody = document.getElementById("modalBodyContent");
    if (!modalBody) return;
    const createSkillTags = (skills) => {
      if (!Array.isArray(skills) || skills.length === 0) {
        return '<span class="text-muted fst-italic">Chưa cập nhật</span>';
      }
      return skills
        .map((skill) => `<span class="profile-skill-tag">${skill}</span>`)
        .join("");
    };
    const createExperienceList = (experiences) => {
      if (!Array.isArray(experiences) || experiences.length === 0) {
        return "<p>Chưa có kinh nghiệm làm việc.</p>";
      }
      return experiences
        .map(
          (exp) => `
      <div class="profile-experience-item">
        <h6>${exp.company}</h6>
        <p class="text-muted mb-1">${exp.year}</p>
        <p>${exp.description}</p>
      </div>
    `
        )
        .join("");
    };
    const createEducationList = (educationList) => {
      if (!Array.isArray(educationList) || educationList.length === 0) {
        return "<p>Chưa có thông tin học vấn.</p>";
      }
      return educationList
        .map(
          (edu) => `
        <div class="profile-experience-item">
            <h6>${edu.school}</h6>
            <p class="text-muted mb-1">${edu.year}</p>
            <p>${edu.major}</p>
        </div>
    `
        )
        .join("");
    };
    const createProjectsList = (projects) => {
      if (!Array.isArray(projects) || projects.length === 0) {
        return "<p>Chưa có dự án nào.</p>";
      }
      return projects
        .map(
          (proj) => `
      <div class="profile-experience-item">
        <h6>${proj.name}</h6>
        <p>${proj.description}</p>
      </div>
    `
        )
        .join("");
    };
    modalBody.innerHTML = `
    <div class="text-center mb-4">
      <img src="${member.avatar}" alt="${
      member.name
    }" class="rounded-circle mb-3" width="120" height="120">
      <h3>${member.name}</h3>
      <p class="text-muted">${
        Array.isArray(member.roles) ? member.roles.join(" / ") : member.roles
      }</p>
      <p><a href="mailto:${member.email}">${member.email || ""}</a></p>
    </div>
    <div class="profile-section mb-4">
      <h5>Giới thiệu</h5>
      <p>${member.introduction || "Chưa có thông tin."}</p>
    </div>
    <div class="profile-section mb-4">
      <h5>Dự án nổi bật</h5>
      ${createProjectsList(member.major_projects)}
    </div>
    <div class="profile-section mb-4">
      <h5>Kinh nghiệm làm việc</h5>
      ${createExperienceList(member.experience)}
    </div>
    <div class="profile-section mb-4">
        <h5>Học vấn</h5>
        ${createEducationList(member.education)}
    </div>
    <div class="profile-section mb-4">
      <h5>Kỹ năng</h5>
      <h6>3D & Thiết kế</h6>
      <div>${createSkillTags(member.skills ? member.skills.Design : [])}</div>
      <h6 class="mt-3">Lập trình</h6>
      <div>${createSkillTags(
        member.skills ? member.skills.programming : []
      )}</div>
      <h6 class="mt-3">Phần cứng</h6>
      <div>${createSkillTags(member.skills ? member.skills.hardware : [])}</div>
       <h6 class="mt-3">Phần mềm</h6>
      <div>${createSkillTags(member.skills ? member.skills.software : [])}</div>
    </div>
    <div class="profile-section">
      <h5>Liên hệ</h5>
      <div class="profile-contact-links">
        ${
          member.contact_links && member.contact_links.email
            ? `<a href="${member.contact_links.email}" target="_blank" title="Email"><i class="fas fa-envelope"></i></a>`
            : ""
        }
        ${
          member.contact_links && member.contact_links.tiktok
            ? `<a href="${member.contact_links.tiktok}" target="_blank" title="Tiktok"><i class="fab fa-tiktok"></i></a>`
            : ""
        }
        ${
          member.contact_links && member.contact_links.facebook
            ? `<a href="${member.contact_links.facebook}" target="_blank" title="Facebook"><i class="fab fa-facebook"></i></a>`
            : ""
        }
      </div>
    </div>
  `;
  }

  function initializeSwiper() {
    new Swiper(".team-swiper", {
      effect: "coverflow",
      grabCursor: true,
      centeredSlides: true,
      slidesPerView: "auto",
      loop: true,
      autoplay: {
        delay: 2000,
        disableOnInteraction: false,
      },
      coverflowEffect: {
        rotate: -40,
        stretch: 0,
        depth: 50,
        modifier: 1,
        slideShadows: true,
      },
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
    });
  }

  /**
   * ===================================================================
   * BẮT ĐẦU PHẦN CẬP NHẬT LOGIC MODAL DỰ ÁN
   * ===================================================================
   */

  let featuredSwiper = null;

  function setupProjectModalListener() {
    document.addEventListener("click", function (event) {
      const projectCard = event.target.closest(
        '.project-card[data-bs-target="#projectDetailModal"]'
      );
      if (projectCard) {
        const projectId = projectCard.getAttribute("data-project-id");
        if (projectId) {
          loadProjectDetails(projectId);
        }
      }
    });

    const projectModal = document.getElementById("projectDetailModal");
    projectModal.addEventListener("hidden.bs.modal", function () {
      if (featuredSwiper) {
        featuredSwiper.destroy(true, true);
        featuredSwiper = null;
      }
    });
  }

  async function loadProjectDetails(projectId) {
    const modalBody = document.getElementById("projectModalBodyContent");
    modalBody.innerHTML = '<div class="spinner-modal"></div>';

    const modalContent = modalBody.closest(".modal-content");
    const oldCloseBtn = modalContent.querySelector(".btn-close-modal-custom");
    if (oldCloseBtn) oldCloseBtn.remove();
    const oldContactBtn = modalContent.querySelector(".btn-modal-contact");
    if (oldContactBtn) oldContactBtn.remove();

    try {
      const docRef = db.collection("projects").doc(projectId);
      const doc = await docRef.get();

      if (doc.exists) {
        populateProjectModal(doc.data());
      } else {
        console.warn("Không tìm thấy dự án với ID:", projectId);
        modalBody.innerHTML =
          "<p>Không tìm thấy thông tin chi tiết cho dự án này.</p>";
      }
    } catch (error) {
      console.error("Lỗi khi tải chi tiết dự án: ", error);
      modalBody.innerHTML =
        "<p>Đã có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.</p>";
    }
  }

  function populateProjectModal(data) {
    if (data.projectType === "category") {
      populateCategoryModal(data);
    } else {
      populateDetailModal(data);
    }
  }

  // --- CÁC HÀM TẠO HTML (ĐÃ DI CHUYỂN RA NGOÀI) ---
  const createImageCarousel = (images) => {
    if (!Array.isArray(images) || images.length === 0) {
      return '<img src="https://res.cloudinary.com/de8t7t3ij/image/upload/v1761273943/placeholder_project_z5v2jz.png" alt="Placeholder" class="img-fluid rounded">';
    }
    const slides = images
      .map(
        (imgUrl) => `
    <div class="swiper-slide">
      <img src="${imgUrl}" alt="Project image" class="img-fluid rounded" />
    </div>
  `
      )
      .join("");
    return `
    <div class="swiper project-image-swiper">
      <div class="swiper-wrapper">
        ${slides}
      </div>
      <div class="swiper-pagination project-image-pagination"></div>
    </div>
  `;
  };

  const createTags = (tags) => {
    if (!Array.isArray(tags) || tags.length === 0) return "";
    return tags
      .map((tagObject) => {
        const tagName = Object.keys(tagObject)[0];
        const tagUrl = Object.values(tagObject)[0];
        if (tagUrl) {
          return `<a href="${tagUrl}" target="_blank" class="project-modal-tag">${tagName}</a>`;
        } else {
          return `<span class="project-modal-tag">${tagName}</span>`;
        }
      })
      .join("");
  };

  // --- HÀM MODAL DANH MỤC ---
  function populateCategoryModal(data) {
    const modalBody = document.getElementById("projectModalBodyContent");
    const modalTitleEl = document.getElementById("projectDetailModalLabel");
    const modalContent = modalBody.closest(".modal-content");

    modalTitleEl.style.display = "none";

    const createProjectLinksList = (projects) => {
      if (!Array.isArray(projects) || projects.length === 0) {
        return "<p>Chưa có dự án tiêu biểu nào.</p>";
      }
      return `
        <ul class="project-modal-list">
          ${projects
            .map(
              (proj) => `
            <li>
              <a href="${proj.url}" class="modal-category-link">
                ${proj.name}
              </a>
            </li>
          `
            )
            .join("")}
        </ul>
      `;
    };

    modalBody.innerHTML = `
      <div class="container-fluid">
        <div class="row">
          <div class="col-12">
            <h2 class="project-modal-title">${data.title || "Dự án"}</h2>
            <div class="d-flex mb-3">
              ${createTags(data.tags)}
            </div>
          </div>
        </div>
        <div class="row gy-4">
          <div class="col-lg-5">
            ${createImageCarousel(data.imageCarousel)}
          </div>
          <div class="col-lg-7">
            <div class="project-modal-section">
              <h6>MÔ TẢ CHI TIẾT</h6>
              <p>${data.description || "Chưa có mô tả."}</p>
            </div>
            <div class="project-modal-section">
              <h6>CÔNG NGHỆ & QUY TRÌNH</h6>
              <ul class="project-modal-list">
                ${(data.techProcess || [])
                  .map((item) => `<li>${item}</li>`)
                  .join("")}
              </ul>
            </div>
            <div class="project-modal-section">
              <h6>DỰ ÁN TIÊU BIỂU</h6>
              ${createProjectLinksList(data.featuredProjects)}
            </div>
          </div> 
        </div> 
      </div> 
    `;

    modalContent.insertAdjacentHTML(
      "beforeend",
      `<button type="button" class="btn-close btn-close-modal-custom" data-bs-dismiss="modal" aria-label="Close"></button>`
    );
    modalContent.insertAdjacentHTML(
      "beforeend",
      `<a href="#" id="modalContactLink" class="btn btn-hero btn-modal-contact">
        Liên hệ tư vấn
      </a>`
    );

    const projectModalEl = document.getElementById("projectDetailModal");
    const projectModalInstance =
      bootstrap.Modal.getOrCreateInstance(projectModalEl);
    const modalContactButton = modalContent.querySelector("#modalContactLink");

    if (modalContactButton) {
      modalContactButton.addEventListener("click", (e) => {
        e.preventDefault();
        projectModalEl.addEventListener(
          "hidden.bs.modal",
          () => {
            const targetElement = document.querySelector("#contact");
            if (targetElement) {
              targetElement.scrollIntoView({ behavior: "smooth" });
            }
          },
          { once: true }
        );
        projectModalInstance.hide();
      });
    }

    modalBody.querySelectorAll(".modal-category-link").forEach((link) => {
      link.addEventListener("click", () => {
        projectModalInstance.hide();
      });
    });

    if (data.imageCarousel && data.imageCarousel.length > 0) {
      if (featuredSwiper) {
        featuredSwiper.destroy(true, true);
        featuredSwiper = null;
      }
      featuredSwiper = new Swiper(".project-image-swiper", {
        slidesPerView: 1,
        spaceBetween: 15,
        grabCursor: true,
        loop: true,
        pagination: {
          el: ".project-image-pagination",
          clickable: true,
        },
        autoplay: {
          delay: 3000,
          disableOnInteraction: false,
        },
      });
    }
  }

  // --- HÀM MODAL CHI TIẾT ---
  function populateDetailModal(data) {
    const modalBody = document.getElementById("projectModalBodyContent");
    const modalTitleEl = document.getElementById("projectDetailModalLabel");
    const modalContent = modalBody.closest(".modal-content");

    modalTitleEl.style.display = "none";

    const createList = (items) => {
      if (!Array.isArray(items) || items.length === 0)
        return "<p>Chưa có thông tin.</p>";
      return `
      <ul class="project-modal-list">
        ${items.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    `;
    };

    modalBody.innerHTML = `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <h2 class="project-modal-title">${data.title || "Chi tiết dự án"}</h2>
          <div class="d-flex mb-3">
            ${createTags(data.tags)}
          </div>
        </div>
      </div>
      <div class="row gy-4">
        <div class="col-lg-6">
          ${createImageCarousel(data.imageCarousel)}
        </div>
        <div class="col-lg-6">
          <div class="project-modal-section">
            <h6>Mô tả chi tiết</h6>
            <p>${data.description || "Chưa có mô tả."}</p>
          </div>
          <div class="project-modal-section">
            <h6>Công nghệ & Quy trình</h6>
            ${createList(data.techProcess)}
          </div>
          <div class="project-modal-section">
            <h6>DỰ ÁN TIÊU BIỂU</h6>
            ${createList(data.featuredProjects)}
          </div>
        </div> 
      </div> 
    </div> 
  `;

    modalContent.insertAdjacentHTML(
      "beforeend",
      `<button type="button" class="btn-close btn-close-modal-custom" data-bs-dismiss="modal" aria-label="Close"></button>`
    );
    modalContent.insertAdjacentHTML(
      "beforeend",
      `<a href="#" id="modalContactLink" class="btn btn-hero btn-modal-contact">
        Liên hệ tư vấn dự án
      </a>`
    );

    const projectModalEl = document.getElementById("projectDetailModal");
    const projectModalInstance =
      bootstrap.Modal.getOrCreateInstance(projectModalEl);
    const modalContactButton = modalContent.querySelector("#modalContactLink");

    if (modalContactButton) {
      modalContactButton.addEventListener("click", (e) => {
        e.preventDefault();
        projectModalEl.addEventListener(
          "hidden.bs.modal",
          () => {
            const targetElement = document.querySelector("#contact");
            if (targetElement) {
              targetElement.scrollIntoView({ behavior: "smooth" });
            }
          },
          { once: true }
        );
        projectModalInstance.hide();
      });
    }

    if (data.imageCarousel && data.imageCarousel.length > 0) {
      if (featuredSwiper) {
        featuredSwiper.destroy(true, true);
        featuredSwiper = null;
      }
      featuredSwiper = new Swiper(".project-image-swiper", {
        slidesPerView: 1,
        spaceBetween: 15,
        grabCursor: true,
        loop: true,
        pagination: {
          el: ".project-image-pagination",
          clickable: true,
        },
        autoplay: {
          delay: 3000,
          disableOnInteraction: false,
        },
      });
    }

    const projectModal = document.getElementById("projectDetailModal");
    projectModal.addEventListener(
      "hidden.bs.modal",
      () => {
        modalTitleEl.style.display = "block";
      },
      { once: true }
    );
  }

  // ===== TỐI ƯU HÓA: HÀM MỚI ĐỂ TẢI LAZY LOAD TEAM SWIPER =====
  async function lazyLoadTeamSection() {
    if (teamSectionLoaded) return; // Nếu đã tải rồi thì không làm gì cả
    teamSectionLoaded = true; // Đánh dấu là đã tải

    console.log("Đang tải dữ liệu team (lazy)...");
    allMembersData = await fetchTeamMembers();
    if (allMembersData && allMembersData.length > 0) {
      populateSwiper(allMembersData);
      initializeSwiper();
    } else {
      console.log("Không có thành viên nào để hiển thị.");
    }
  }

  // ===== TỐI ƯU HÓA: HÀM MỚI ĐỂ QUAN SÁT VÀ TẢI LAZY LOAD =====
  function setupLazyLoading() {
    // Mục tiêu là section #project, ngay phía trên team swiper
    const target = document.querySelector("#project");
    if (!target) return; // Nếu không tìm thấy, bỏ qua

    const observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Khi người dùng cuộn tới section #project
            lazyLoadTeamSection(); // Bắt đầu tải dữ liệu team
            observer.unobserve(target); // Ngừng quan sát sau khi đã tải
          }
        });
      },
      {
        rootMargin: "100px", // Bắt đầu tải khi còn cách 100px
      }
    );

    observer.observe(target); // Bắt đầu quan sát
  }

  /**
   * ===================================================================
   * HÀM MAIN (ĐÃ CẬP NHẬT)
   * ===================================================================
   */
  async function main() {
    // Các hàm này chạy ngay lập tức
    setupSmoothScroll();
    setupScrollSpy();
    setupInteractiveText();
    setupNavbarScrollEffect();
    setupProjectModalListener();

    // TỐI ƯU HÓA:
    // XÓA 3 HÀM TẢI TEAM KHỎI ĐÂY...
    // allMembersData = await fetchTeamMembers();
    // populateSwiper(allMembersData);
    // initializeSwiper();

    // ...VÀ THAY BẰNG HÀM LAZY LOAD MỚI
    setupLazyLoading();

    // Listener cho profile button vẫn giữ nguyên
    document.addEventListener("click", function (event) {
      const profileButton = event.target.closest("[data-member-id]");
      if (profileButton) {
        const memberId = profileButton.getAttribute("data-member-id");
        displayMemberProfile(memberId);
      }
    });
  }

  // Chạy hàm chính
  main();
});

// Logic Preloader vẫn giữ nguyên
window.addEventListener("load", () => {
  const preloader = document.getElementById("preloader");
  if (preloader) {
    preloader.classList.add("hidden");
  }
});
function setupInteractiveText() {
  const videoText = document.querySelector(".video-text");
  if (!videoText) return;
  videoText.addEventListener("mousemove", (e) => {
    const rect = videoText.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    videoText.style.setProperty("--mouse-x", x + "px");
    videoText.style.setProperty("--mouse-y", y + "px");
  });
  videoText.addEventListener("mouseleave", () => {
    videoText.style.setProperty("--mouse-x", "50%");
    videoText.style.setProperty("--mouse-y", "50%");
  });
}
function setupNavbarScrollEffect() {
  const navbar = document.querySelector(".navbar");
  if (!navbar) return;
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar.classList.add("navbar-scrolled");
    } else {
      navbar.classList.remove("navbar-scrolled");
    }
  });
}
