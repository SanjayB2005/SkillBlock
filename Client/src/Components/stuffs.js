{/* Project Management Section */}
<div className="bg-gray-800 p-6 rounded-lg">
<div className="flex justify-between items-center mb-6">
  <h2 className="text-xl font-semibold text-white">Your Projects</h2>
  <button
    onClick={() => {
      resetForm();
      setIsModalOpen(true);
    }}
    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white flex items-center space-x-2"
  >
    <FiPlus />
    <span>New Project</span>
  </button>
</div>

{/* Project filtering */}
<div className="flex flex-wrap items-center gap-4 mb-6">
  <div className="flex flex-wrap gap-2">
    {categories.map(category => (
      <button
        key={category.id}
        onClick={() => setSelectedCategory(category.id)}
        className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${selectedCategory === category.id
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
      >
        {category.icon}
        <span>{category.label}</span>
      </button>
    ))}
  </div>
  <div className="flex-1 min-w-[200px]">
    <input
      type="text"
      placeholder="Search projects..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
    />
  </div>
</div>

{/* Loading state */}
{loading && (
  <div className="flex justify-center py-10">
    <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
  </div>
)}

{/* Error state */}
{error && !loading && (
  <div className="bg-red-900/30 text-red-200 p-4 rounded-lg text-center my-6">
    <FiAlertCircle size={24} className="mx-auto mb-2" />
    <p>{error}</p>
    <button
      onClick={() => fetchProjects()}
      className="mt-3 px-4 py-1 bg-red-700 hover:bg-red-800 rounded"
    >
      Retry
    </button>
  </div>
)}

{/* Projects list */}
{!loading && !error && projects.length > 0 ? (
  <div className="space-y-4">
    {projects.map(project => (
      <div key={project._id} className="p-4 bg-gray-700 rounded-lg hover:bg-gray-700/80 transition">
        <div className="flex justify-between flex-wrap">
          <h3 className="text-white font-semibold">{project.title}</h3>
          <span className={`px-2 py-1 rounded text-xs ${project.status === 'open'
              ? 'bg-blue-900/60 text-blue-300'
              : project.status === 'in_progress'
                ? 'bg-yellow-900/60 text-yellow-300'
                : project.status === 'completed'
                  ? 'bg-green-900/60 text-green-300'
                  : 'bg-gray-900/60 text-gray-300'
            }`}>
            {project.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        <p className="text-gray-400 mt-2">{project.description}</p>

        <div className="flex flex-wrap justify-between items-center mt-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-blue-400">{formatCurrency(project.budget)}</span>
            <span className="text-gray-400">
              {project.deadline
                ? `Due: ${new Date(project.deadline).toLocaleDateString()}`
                : 'No deadline'}
            </span>
            <span className="text-gray-400 capitalize">
              {project.category}
            </span>
          </div>

          <div className="flex flex-wrap space-x-2 mt-2 sm:mt-0">
            {/* View Details Button */}
            <button
              onClick={() => handleViewProjectDetails(project)}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-sm flex items-center space-x-1"
            >
              <FiEye size={14} />
              <span>View Details</span>
            </button>

            {/* View Proposals Button */}
            <button
              onClick={() => handleViewProposals(project)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm flex items-center space-x-1"
            >
              <FiSend size={14} />
              <span>Proposals {project.proposalCount > 0 ? `(${project.proposalCount})` : ''}</span>
            </button>

            <button
              onClick={() => handleEditProject(project)}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-sm flex items-center space-x-1"
              disabled={['completed', 'cancelled'].includes(project.status)}
            >
              <FiEdit2 size={14} />
              <span>Edit</span>
            </button>

            <button
              onClick={() => setConfirmDelete(project)}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm flex items-center space-x-1"
              disabled={['in_progress', 'completed'].includes(project.status)}
            >
              <FiTrash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {project.skills?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {project.skills.map((skill, i) => (
              <span key={i} className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-full">
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
    ))}

    {/* Pagination */}
    {pagination.pages > 1 && (
      <div className="flex justify-center mt-6 space-x-2">
        {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => fetchProjects(page)}
            className={`px-3 py-1 rounded ${pagination.current === page
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
          >
            {page}
          </button>
        ))}
      </div>
    )}
  </div>
) : (
  !loading && !error && (
    <div className="text-center py-12">
      <FiBriefcase size={48} className="mx-auto text-gray-600 mb-4" />
      <p className="text-gray-400 mb-4">No projects found matching your criteria.</p>
      <button
        onClick={() => {
          resetForm();
          setIsModalOpen(true);
        }}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
      >
        Create Your First Project
      </button>
    </div>
  )
)}
</div>